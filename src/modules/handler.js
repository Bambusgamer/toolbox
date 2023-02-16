/* eslint-disable max-len */
/* eslint-disable no-unused-vars */
const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const { REST } = require('@discordjs/rest');
const {
    Collection,
    Routes,
    Client,
    Events,
} = require('discord.js');
const Logger = require('./logger');
const Server = require('./server');
const statics = require('../util/statics');
const CommandBuilder = require('../classes/command');
const EventBuilder = require('../classes/event');
const InteractionBuilder = require('../classes/interaction');

module.exports = class Handler extends EventEmitter {
    // Private fields
    #rest = null;
    #client = null;
    #eventsPath = null;
    #commandsPath = null;
    #interactionsPath = null;
    #hydrationModules = null;
    #customEmitters = null;
    #oldstate = null;
    /**
     * Returns the path from where the Handler was called
     * @return {string} path of the instance
     */
    #getInstPath() {
        const stack = new Error().stack;
        const frame = stack.split('\n')[3].trim().replace(/\\/g, '/');
        // Credits to discord@A7mooz#2962 for the regex
        const regex = /([A-Z]:)?((\/)([a-zA-Z0-9_ ]\.?)+)+\3/g;
        const path = regex.exec(frame)[0];
        return path;
    }
    /**
     * Checks if the Handler is ready to register slash commands
     * @return {boolean} Whether the Handler is ready or not
     */
    #ready() {
        if (!this.#rest) return false;
        if (!this.#client) return false;
        return true;
    }
    /**
     * Initializes the handler module
     * @param {object} obj Handler options
     * @param {customclient} obj.client The client to attach the collections to
     * @param {object} obj.paths The paths to use relative to from where the constructor is called
     * @param {string} obj.paths.events The path to the events folder
     * @param {string} obj.paths.commands The path to the commands folder
     * @param {string} obj.paths.interactions The path to the interactions folder
     * @param {object} obj.hydrationModules The modules to hydrate
     * @param {string} obj.restToken The token to use for the rest client
     * @param {array} obj.customEmitters The custom emitters to listen to
     */
    constructor({ client, paths, hydrationModules, restToken, customEmitters }) {
        super();
        const { events, commands, interactions } = paths;
        this.#client = client;
        if (!client) throw new Error('Client is required to hydrate command');
        if (!(client instanceof Client)) throw new Error('Client must be an instance of Discord.Client');
        if (events && typeof events !== 'string') throw new Error('Events path must be a string');
        if (events) this.#eventsPath = path.join(this.#getInstPath(), events);
        if (commands && typeof commands !== 'string') throw new Error('Commands path must be a string');
        if (commands) this.#commandsPath = path.join(this.#getInstPath(), commands);
        if (interactions && typeof interactions !== 'string') throw new Error('Interactions path must be a string');
        if (interactions) this.#interactionsPath = path.join(this.#getInstPath(), interactions);
        if (hydrationModules && typeof hydrationModules !== 'object') throw new Error('Hydration modules must be an object');
        if (customEmitters && !Array.isArray(customEmitters)) throw new Error('Custom emitters must be an array');
        if (customEmitters) this.#customEmitters = customEmitters;

        this.events = new Collection();
        this.slashCommands = new Collection();
        this.betaSlashCommands = new Collection();
        this.textCommands = new Collection();
        this.interactions = new Collection();

        this.#hydrationModules = hydrationModules || {};

        if (restToken) {
            this.#rest = new REST({ version: '9' }).setToken(restToken);
            // check if the token is valid by requesting the client user
            this.#rest.get(Routes.user('@me')).then(() => {
                Logger.info('REST client initialized');
            }).catch((err) => {
                Logger.fatal([err, 'REST client failed initialization']);
                this.#rest = null;
            });
        } else Logger.warn('Handler REST client disabled');
        this.#listenEvents();
        Logger.info('Handler module initialized');
    }
    /**
     * Listens to all events and dynamically passes them to registered events
     * @return {void}
     * @private
     */
    #listenEvents() {
        for (const event of Object.values(Events)) {
            this.#client.on(event, (...args) => {
                if (this.events.has(event)) {
                    for (const listener of this.events.get(event)) {
                        try {
                            listener(...args);
                        } catch (err) {
                            Logger.error([err, `Error in event ${event}`]);
                        }
                    }

                    this.events.set(event, this.events.get(event).filter((listener) => !listener?.emitter ? !listener.once : true));
                }
            });
        };

        if (this.#customEmitters) {
            for (const emitter of this.#customEmitters) {
                for (const event of emitter.events) {
                    emitter.on(event, (...args) => {
                        if (this.events.has(event)) {
                            for (const listener of this.events.get(event)) {
                                try {
                                    listener(...args);
                                } catch (err) {
                                    Logger.error([err, `Error in event ${event}`]);
                                }
                            }

                            this.events.set(event, this.events.get(event).filter((listener) => !listener?.emitter ? true : (listener.emitter === emitter.name ? !listener.once : true)));
                        }
                    });
                }
            }
        }
    }
    /**
     * Loads all the events, commands and interactions
     * @return {boolean} Success of the operation
     */
    load() {
        let success = false;
        if (this.#commandsPath) {
            Logger.infoy('\nCommands:');
            success = this.#loadCommands();
        }
        if (this.#eventsPath) {
            Logger.infoy('\nEvents:');
            success = this.#loadEvents() && success;
        }
        if (this.#interactionsPath) {
            Logger.infoy('\nInteractions:');
            success = this.#loadInteractions() && success;
        }
        if (this.#commandsPath || this.#interactionsPath || this.#eventsPath) Logger.newline();
        if (!success) {
            Logger.warn('Handler failed to load');
            this.#restore();
        }
        return success;
    }
    /**
     * Clears all the events, commands and interactions
     * @return {void}
     * @private
     */
    clear() {
        this.#oldstate = {
            events: this.events.clone(),
            slashCommands: this.slashCommands.clone(),
            BetaSlashCommands: this.betaSlashCommands.clone(),
            textCommands: this.textCommands.clone(),
            interactions: this.interactions.clone(),
        };
        this.events.clear();
        this.interactions.clear();
        this.slashCommands.clear();
        this.betaSlashCommands.clear();
        this.textCommands.clear();
    }
    /**
     * Reloads all the events, commands and interactions
     * @return {boolean} Success of the operation
     */
    reload() {
        this.clear();
        return this.load();
    }
    /**
     * Restores all the events, commands and interactions if a reload fails
     * @private
     */
    #restore() {
        if (this.#oldstate) {
            this.events = this.#oldstate.events;
            this.interactions = this.#oldstate.interactions;
            this.slashCommands = this.#oldstate.slashCommands;
            this.betaSlashCommands = this.#oldstate.BetaSlashCommands;
            this.textCommands = this.#oldstate.textCommands;
            Logger.infoy('Restored old state');
        }
    }
    /**
     * Loads all the events
     * @return {boolean} Success of the operation
     * @private
     */
    #loadEvents() {
        let success = true;
        try {
            const elements = fs.readdirSync(this.#eventsPath, { withFileTypes: true });
            const folders = elements.filter((element) => element.isDirectory());
            const files = elements.filter((element) => element.isFile()).filter((element) => element.name.endsWith('.js'));
            const loadFile = (file) => {
                const fileName = file.split('\\').pop().split('/').pop().split('.')[0];
                delete require.cache[require.resolve(path.join(this.#eventsPath, file))];
                if (file.startsWith('_')) return Logger.infog(`${fileName} skipped`);
                const event = require(path.join(this.#eventsPath, file));
                if (!(event instanceof EventBuilder)) return;
                event.hydrate(this.#client, this.#hydrationModules);
                let listeners = this.events.get(event.name);
                if (!listeners) {
                    listeners = new Array(event);
                } else listeners.push(event);
                this.events.set(event.name, listeners);
                Logger.infog(`${event.name} loaded`);
            };
            for (const folder of folders) {
                const folderPath = path.join(this.#eventsPath, folder.name);
                const folderElements = fs.readdirSync(folderPath, { withFileTypes: true });
                const folderFiles = folderElements.filter((element) => element.isFile()).filter((element) => element.name.endsWith('.js'));
                if (folderFiles.length > 0) Logger.infoy(`\n${folder.name} events`);
                for (const file of folderFiles) {
                    loadFile(path.join(folder.name, file.name));
                };
            };
            if (files.length > 0) Logger.infoy('\nroot events');
            for (const file of files) {
                loadFile(file.name);
            };
        } catch (err) {
            Logger.error(err);
            success = false;
        }
        return success;
    }
    /**
     * Loads all the interactions
     * @return {boolean} Success of the operation
     * @private
     */
    #loadInteractions() {
        let success = true;
        try {
            const elements = fs.readdirSync(this.#interactionsPath, { withFileTypes: true });
            const folders = elements.filter((element) => element.isDirectory());
            const files = elements.filter((element) => element.isFile()).filter((element) => element.name.endsWith('.js'));
            const loadFile = (file) => {
                const fileName = file.split('\\').pop().split('/').pop().split('.')[0];
                delete require.cache[require.resolve(path.join(this.#interactionsPath, file))];
                if (fileName.startsWith('_')) return Logger.infog(`${fileName} skipped`);
                const interaction = require(path.join(this.#interactionsPath, file));
                if (!(interaction instanceof InteractionBuilder)) return;
                interaction.hydrate(this.#client, this.#hydrationModules);
                this.interactions.set(interaction.name, interaction);
                Logger.infog(`${fileName} loaded`);
            };
            for (const folder of folders) {
                const folderElements = fs.readdirSync(path.join(this.#interactionsPath, folder.name), { withFileTypes: true });
                const folderFiles = folderElements.filter((element) => element.isFile()).filter((element) => element.name.endsWith('.js'));
                if (folderFiles.length > 0) Logger.infoy(`\n${folder.name} interactions`);
                for (const file of folderFiles) {
                    loadFile(path.join(folder.name, file.name));
                };
            };
            if (files.length > 0) Logger.infoy('\nroot interactions');
            for (const file of files) {
                loadFile(file.name);
            };
        } catch (err) {
            Logger.error(err);
            success = false;
        }
        return success;
    }
    /**
     * Loads all the commands
     * @return {boolean} Success of the operation
     * @private
     */
    #loadCommands() {
        let success = true;
        try {
            const elements = fs.readdirSync(this.#commandsPath, { withFileTypes: true });
            const folders = elements.filter((element) => element.isDirectory());
            const files = elements.filter((element) => element.isFile()).filter((element) => element.name.endsWith('.js'));
            const loadFile = (file) => {
                const fileName = file.split('\\').pop().split('/').pop().split('.')[0];
                delete require.cache[require.resolve(path.join(this.#commandsPath, file))];
                if (fileName.startsWith('_')) return Logger.infog(`${fileName} skipped`);
                const command = require(path.join(this.#commandsPath, file));
                if (!(command instanceof CommandBuilder)) return;
                command.hydrate(this.#client, this.#hydrationModules);
                if (command.hasSlash) {
                    this.slashCommands.set(command.customId, command.slash);
                };
                if (command.hasBetaSlash) {
                    this.betaSlashCommands.set(command.betaCustomId, command.betaSlash);
                };
                if (command.hasText) {
                    this.textCommands.set(command.name, command.text);
                    for (const alias of command.aliases) {
                        this.textCommands.set(alias, command.text);
                    };
                };
                Logger.infog(`${fileName} loaded`);
            };
            for (const folder of folders) {
                const folderElements = fs.readdirSync(path.join(this.#commandsPath, folder.name), { withFileTypes: true });
                const folderFiles = folderElements.filter((element) => element.isFile()).filter((element) => element.name.endsWith('.js'));
                if (folderFiles.length > 0) Logger.infoy(`\n${folder.name} commands`);
                for (const file of folderFiles) {
                    loadFile(path.join(folder.name, file.name));
                }
            }
            if (files.length > 0) Logger.infoy('\nroot commands');
            for (const file of files) {
                loadFile(file.name);
            }
        } catch (err) {
            Logger.error(err);
            success = false;
        }
        return success;
    }
    /**
     * Registers all the slash commands
     * @return {boolean} Success of the operation
     * @async
     */
    async registerSlash() {
        try {
            if (!this.#ready()) return (Logger.error('Client and rest not ready') && false);
            const body = [];
            this.slashCommands.forEach((command) => {
                body.push(command.data);
            });
            this.#rest.put(
                Routes.applicationCommands(this.#client.user.id),
                { body },
            ).then((data) => Logger.infog(`Registered ${data.length} slash commands`));
        } catch (err) {
            Logger.error(err);
            return false;
        }
        return true;
    };
    /**
     * Registers beta slash commands
     * @param {(string | array<string> | null)} commands The commands to register (null for all)
     * @param {string} guildId The guild id to register the commands to
     * @return {boolean} Success of the operation
     * @async
     */
    async registerBetaSlash(commands, guildId) {
        try {
            if (!this.#ready()) return (Logger.error('Client and rest not ready') && false);
            const body = [];
            if (commands === null) {
                this.betaSlashCommands.forEach((command) => {
                    body.push(command.data);
                });
            } else if (typeof commands === 'array') {
                this.betaSlashCommands.forEach((command) => {
                    if (commands.includes(command.data.name)) body.push(command.data);
                });
            } else if (typeof commands === 'string') {
                this.betaSlashCommands.forEach((command) => {
                    if (commands === command.data.name) body.push(command.data);
                });
            } else {
                Logger.warn('Invalid commands type. Viable types are: string, array<string>, null');
                return false;
            }
            if (!guildId || typeof guildId !== 'string') return (Logger.warn('Invalid guild id') && false);
            this.#rest.put(
                Routes.applicationGuildCommands(this.#client.user.id, guildId),
                { body },
            ).then((data) => Logger.infog(`Registered ${data.length} beta slash commands`));
        } catch (err) {
            Logger.error(err);
            return false;
        }
        return true;
    };
    /**
     * Deletes a slash command
     * @param {string} commandId The command id
     * @param {string} guildId The guild id leave null for global
     * @return {boolean} Success of the operation
     * @async
     */
    async deleteSlash(commandId, guildId) {
        try {
            if (!this.#ready()) return (Logger.error('Client and rest not ready') && false);
            if (!commandId || typeof commandId !== 'string') return (Logger.warn('Invalid command id') && false);
            if (guildId && typeof guildId !== 'string') return (Logger.warn('Invalid guild id') && false);
            if (!guildId) {
                await this.#rest.delete(
                    Routes.applicationCommand(this.#client.user.id, commandId),
                );
            } else {
                await this.#rest.delete(
                    Routes.applicationGuildCommand(this.#client.user.id, guildId, commandId),
                );
            }
            Logger.infog(`Deleted slash command ${commandId}`);
        } catch (err) {
            Logger.error(err);
            return false;
        }
        return true;
    };
};

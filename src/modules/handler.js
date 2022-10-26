/* eslint-disable max-len */
/* eslint-disable no-unused-vars */
const fs = require('fs');
const _path = require('path');
const { REST } = require('@discordjs/rest');
const {
    Collection,
    Routes,
} = require('discord.js');
const {
    Logger,
    Config,
    CommandBuilder,
    EventBuilder,
    InteractionBuilder,
} = require('../');
const App = Config.App;

module.exports = class Handler {
    // Private fields
    #rest = null;
    #client = null;
    #eventsPath = null;
    #commandsPath = null;
    #interactionsPath = null;
    /**
     * Returns the path from where the Handler was called
     * @return {string} path of the instance
     */
    #getInstPath() {
        const stack = new Error().stack;
        const frame = stack.split('\n')[3].trim();
        const path = frame.match(/\((.*):[0-9]+:[0-9]+\)/)[1].split('\\').slice(0, -1).join('\\');
        return path;
    }
    /**
     * Checks if the Handler is ready to register slash commands
     * @return {boolean} Whether the Handler is ready or not
     */
    #ready() {
        if (!this.#rest) return false;
        if (!this.#client) return false;
    }
    /**
     * Initializes the handler module
     * @param {customclient} client The client to attach the collections to
     * @param {object} paths The paths to use relative to from where the constructor is called
     * @param {string} paths.events The path to the events folder
     * @param {string} paths.commands The path to the commands folder
     * @param {string} paths.interactions The path to the interactions folder
     * @param {string} restToken The token to use for the rest client
     */
    constructor(client, paths, restToken) {
        const { events, commands, interactions } = paths;
        this.#client = client;
        if (events) this.#eventsPath = _path.join(this.#getInstPath(), events);
        if (commands) this.#commandsPath = _path.join(this.#getInstPath(), commands);
        if (interactions) this.#interactionsPath = _path.join(this.#getInstPath(), interactions);
        this.events = new Collection();
        this.slashCommands = new Collection();
        this.BetaSlashCommands = new Collection();
        this.textCommands = new Collection();
        this.interactions = new Collection();
        this.events = new Collection();
        if (App) {
            App.post('/Handler/reload', (req, res) => {
                this.clear();
                const success = this.load();
                res.sendStatus(success ? 200 : 500);
            });
            Logger.info('Handler API enabled');
        };
        if (restToken) {
            this.#rest = new REST({ version: '9' }).setToken(restToken);
            // check if the token is valid by requesting the client user
            this.#rest.get(Routes.user('@me')).then((data) => {
                Logger.infoy('Rest client initialized');
            }).catch((err) => {
                Logger.fatal([err, 'Rest client failed initialization']);
                this.#rest = 'invalid';
            });
        } else Logger.warn('Handler REST client disabled');
        Logger.info('Handler module initialized');
    }
    /**
     * Loads all the events, commands and interactions
     * @return {boolean} Success of the operation
     */
    async load() {
        let success = false;
        Logger.infoy('\nCommands:');
        if (this.#commandsPath) success = this.#loadCommands();
        Logger.infoy('\nEvents:');
        if (this.#eventsPath) success = success && this.#loadEvents();
        Logger.infoy('\nInteractions:');
        if (this.#interactionsPath) success = success && this.#loadInteractions();
        return success;
    }
    /**
     * Clears all the events, commands and interactions
     * @return {void}
     * @private
     */
    clear() {
        this.events.clear();
        this.interactions.clear();
        this.slashCommands.clear();
        this.BetaSlashCommands.clear();
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
     * Loads all the events
     * @return {boolean} Success of the operation
     * @private
     */
    #loadEvents() {
        let success = true;
        const client = this.#client;
        try {
            const elements = fs.readdirSync(this.#commandsPath, { withFileTypes: true });
            const folders = elements.filter((element) => element.isDirectory());
            const files = elements.filter((element) => element.isFile()).filter((element) => element.name.endsWith('.js'));
            const loadFile = (file) => {
                const fileName = file.split('\\').pop().split('.')[0];
                delete require.cache[require.resolve(_path.join(folderPath, file.name))];
                if (!file.name.startsWith('_')) return Logger.infog(`${fileName} skipped`);
                const event = require(_path.join(folderPath, file.name));
                if (event instanceof EventBuilder) return;
                if (client._events.includes(event.name)) {
                    if (typeof (client._events[event.name]) != 'function') {
                        client.removeListener(event.name, client._events[event.name][client._events[event.name].length - 1]);
                    } else client.removeListener(event.name, client._events[event.name]);
                };
                if (event.once) {
                    client.once(event.name, event.callback.bind(null, client));
                } else {
                    client.on(event.name, event.callback.bind(null, client));
                }
                Logger.infog(`${event.name} loaded`);
            };
            for (const folder of folders) {
                const folderPath = _path.join(this.#eventsPath, folder.name);
                const folderElements = fs.readdirSync(folderPath, { withFileTypes: true });
                const folderFiles = folderElements.filter((element) => element.isFile()).filter((element) => element.name.endsWith('.js'));
                for (const file of folderFiles) {
                    loadFile(file);
                };
            };
            for (const file of files) {
                loadFile(file);
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
                const fileName = file.split('\\').pop().split('.')[0];
                delete require.cache[require.resolve(_path.join(this.#interactionsPath, file))];
                if (fileName.startsWith('_')) return Logger.infog(`${fileName} skipped`);
                const interaction = require(_path.join(this.#interactionsPath, file));
                if (!interaction instanceof InteractionBuilder) return;
                this.interactions.set(interaction.name, interaction);
                Logger.infog(`${fileName} loaded`);
            };
            for (const folder of folders) {
                const folderElements = fs.readdirSync(_path.join(this.#interactionsPath, folder.name), { withFileTypes: true });
                const folderFiles = folderElements.filter((element) => element.isFile()).filter((element) => element.name.endsWith('.js'));
                if (folderFiles.length > 0) Logger.infoy(`\n${folder.name} interactions`);
                for (const file of folderFiles) {
                    loadFile(_path.join(folder.name, file.name));
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
                const fileName = file.split('\\').pop().split('.')[0];
                delete require.cache[require.resolve(_path.join(this.#commandsPath, file))];
                if (fileName.startsWith('_')) return Logger.infog(`${fileName} skipped`);
                const command = require(_path.join(this.#commandsPath, file));
                if (!command instanceof CommandBuilder) return;
                command.hydrate(this.#client);
                if (command.hasSlash) {
                    this.slashCommands.set(command.customId, command);
                };
                if (command.hasBetaSlash) {
                    this.BetaSlashCommands.set(command.betaCustomId, command);
                };
                if (command.hasText) {
                    this.textCommands.set(command.name, command);
                    for (const alias of command.aliases) {
                        this.textCommands.set(alias, command);
                    };
                };
                Logger.infog(`${fileName} loaded`);
            };
            for (const folder of folders) {
                const folderElements = fs.readdirSync(_path.join(this.#commandsPath, folder.name), { withFileTypes: true });
                const folderFiles = folderElements.filter((element) => element.isFile()).filter((element) => element.name.endsWith('.js'));
                if (folderFiles.length > 0) Logger.infoy(`\n${folder.name} commands`);
                for (const file of folderFiles) {
                    loadFile(_path.join(folder.name, file.name));
                }
            }
            if (files.length > 0) Logger.infoy('\nroot commands');
            for (const file of files) {
                loadFile(file.name);
            }
        } catch (err) {
            Logger.fatal([err]);
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
            for (const command of this.slashCommands.values()) {
                body.push(command.data.toJSON());
            };
            const data = await this.#rest.put(
                Routes.applicationCommands(client.user.id),
                { body },
            );
            Logger.infog(`Registered ${data.length} slash commands`);
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
                for (const command of this.BetaSlashCommands.values()) {
                    commands.push(command.data.toJSON());
                };
            } else if (typeof commands === 'array') {
                for (const command of commands) {
                    if (this.BetaSlashCommands.has(command)) body.push(this.BetaSlashCommands.get(command).data.toJSON());
                };
            } else if (typeof commands === 'string') {
                if (this.BetaSlashCommands.has(commands)) body.push(this.BetaSlashCommands.get(commands).data.toJSON());
            } else {
                Logger.warn('Invalid commands type. Viable types are: string, array<string>, null');
                return false;
            }
            if (!guildId || typeof guildId !== 'string') return (Logger.warn('Invalid guild id') && false);
            const data = await this.#rest.put(
                Routes.applicationGuildCommands(this.#client.user.id, guildId),
                { body },
            );
            Logger.infog(`Registered ${data.length} beta slash commands`);
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
            if (!guildId || typeof guildId !== 'string') {
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

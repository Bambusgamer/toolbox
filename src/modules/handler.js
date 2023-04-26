const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const Logger = require('./logger.js');
const CommandBuilder = require('../classes/command.js');
const EventBuilder = require('../classes/event.js');
const InteractionBuilder = require('../classes/interaction.js');

module.exports = class Handler extends EventEmitter {
    #emitters = [];
    #eventsPath = null;
    #commandsPath = null;
    #interactionsPath = null;
    #hydrationModules = {};
    #options = [];
    #oldstate = null;
    /**
     * @function getInstPath
     * @description Gets the path of the instance
     * @return {string} path of the instance
     * @private
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
     * Initializes the handler module
     * @param {object} obj Handler options
     * @param {array} obj.emitters The emitters to listen to
     * @param {object} obj.paths The paths to use relative to from where the constructor is called
     * @param {string} obj.paths.events The path to the events folder
     * @param {string} obj.paths.commands The path to the commands folder
     * @param {string} obj.paths.interactions The path to the interactions folder
     * @param {object} obj.hydrationModules The object passed to registered functions
     * @param {array} options The options that will be directly passed to registered functions
     */
    constructor({ emitters = [], paths, hydrationModules = {}, options = [] }) {
        super();

        if (!Array.isArray(emitters)) throw new Error('Emitters must be an array');
        for (const emitter of emitters) {
            if (typeof emitter !== 'object') throw new Error('Emitters must be an array of objects');
            if (!emitter.name || typeof emitter.name !== 'string') throw new Error('Emitters must have a name property');
            if (!emitter.emitter || !(emitter.emitter instanceof EventEmitter)) throw new Error('Emitters must have a emitter property that is an EventEmitter');
        }
        if (emitters) this.#emitters = emitters;

        const { events, commands, interactions } = paths;

        if (events && typeof events !== 'string') throw new Error('Events path must be a string');
        if (events) this.#eventsPath = path.join(this.#getInstPath(), events);
        if (commands && typeof commands !== 'string') throw new Error('Commands path must be a string');
        if (commands) this.#commandsPath = path.join(this.#getInstPath(), commands);
        if (interactions && typeof interactions !== 'string') throw new Error('Interactions path must be a string');
        if (interactions) this.#interactionsPath = path.join(this.#getInstPath(), interactions);

        if (typeof hydrationModules !== 'object') throw new Error('Hydration modules must be an object');
        this.#hydrationModules = hydrationModules;

        if (!Array.isArray(options)) throw new Error('Options must be an array');
        this.#options = options;

        this.events = new Map();
        this.slashCommands = new Map();
        this.betaSlashCommands = new Map();
        this.textCommands = new Map();
        this.interactions = new Map();


        this.#listenEvents();
        Logger.info('Handler module initialized');
    }
    /**
     * @function patchEmitter
     * @param {object} emitter The emitter to patch
     * @return {void}
     * @private
     */
    #patchEmitter(emitter) {
        const oldEmit = emitter.emit;
        emitter.emit = function (event, ...args) {
            oldEmit.call(this, '*', event, ...args);
            oldEmit.call(this, event, ...args);
        };
    }
    /**
     * @function listenEvents
     * @description Listens to all events and dynamically passes them to registered events
     * @return {void}
     * @private
     */
    #listenEvents() {
        for (const { name, emitter } of this.#emitters) {
            this.#patchEmitter(emitter);

            emitter.on('*', (event, ...args) => {
                if (this.events.has(event)) {
                    const listeners = this.events.get(event);
                    for (const listener of listeners) {
                        if (typeof listener?.emitter === 'string' && listener.emitter !== name) continue;
                        try {
                            listener.callback(...args);
                        } catch (err) {
                            Logger.error([err, `Error in event ${event}`]);
                        }
                    }

                    this.events.set(event, listeners.filter((listener) => {
                        if (typeof listener?.emitter === 'string' && listener.emitter !== name) return true;
                        return !listener?.once;
                    }));
                }
            });
        }
    }
    /**
     * @function load
     * @description Loads all events, commands and interactions
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
     * @function clear
     * @description Moves all loaded events, commands and interactions to the old state and clears the current state
     * @return {void}
     * @private
     */
    #clear() {
        this.#oldstate = {
            events: new Map(this.events),
            slashCommands: new Map(this.slashCommands),
            BetaSlashCommands: new Map(this.betaSlashCommands),
            textCommands: new Map(this.textCommands),
            interactions: new Map(this.interactions),
        };
        this.events.clear();
        this.interactions.clear();
        this.slashCommands.clear();
        this.betaSlashCommands.clear();
        this.textCommands.clear();
    }
    /**
     * @function reload
     * @description Reloads all the events, commands and interactions
     * @return {boolean} Success of the operation
     */
    reload() {
        this.#clear();
        return this.load();
    }
    /**
     * @function restore
     * @description Restores the old state
     * @return {void}
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
     * @function loadFile
     * @description Loads a file
     * @param {string} path The path to the file
     * @return {object} The loaded file
     * @private
     */
    #loadFile(path) {
        delete require.cache[require.resolve(path)];
        return {
            fileName: path.split('\\').pop().split('/').pop().split('.')[0],
            file: require(path),
        };
    }
    /**
     * @function loadFolder
     * @description Loads a folder
     * @param {string} path The path to the folder
     * @return {array} The loaded files
     * @private
     */
    #loadFolder(path) {
        const elements = fs.readdirSync(path, { withFileTypes: true });
        const folders = elements.filter((element) => element.isDirectory());
        const files = elements.filter((element) => element.isFile()).filter((element) => element.name.endsWith('.js'));
        return [
            ...files.map((file) => this.#loadFile(path + '/' + file.name)),
            ...folders.map((folder) => this.#loadFolder(path + '/' + folder.name)).flat(),
        ];
    }
    /**
     * @function loadEvents
     * @description Loads all the events from the events folder and its subfolders
     * @return {boolean} Success of the operation
     * @private
     */
    #loadEvents() {
        let success = true;
        try {
            const eventFolder = this.#loadFolder(this.#eventsPath);
            for (const { fileName, file: event } of eventFolder) {
                if (fileName.startsWith('_')) return Logger.infog(`${fileName} skipped`);
                if (!(event instanceof EventBuilder)) return;

                event.hydrate(...this.#options, this.#hydrationModules);

                let listeners = this.events.get(event.name);
                if (!listeners) {
                    listeners = new Array(event);
                } else listeners.push(event);
                this.events.set(event.name, listeners);
                Logger.infog(`${event.name} loaded`);
            };
        } catch (err) {
            Logger.error(err);
            success = false;
        }
        return success;
    }
    /**
     * @function loadInteractions
     * @description Loads all the interactions from the interactions folder and its subfolders
     * @return {boolean} Success of the operation
     * @private
     */
    #loadInteractions() {
        let success = true;
        try {
            const interactionFolder = this.#loadFolder(this.#interactionsPath);
            for (const { fileName, file: interaction } of interactionFolder) {
                if (fileName.startsWith('_')) return Logger.infog(`${fileName} skipped`);
                if (!(interaction instanceof InteractionBuilder)) return;

                interaction.hydrate(...this.#options, this.#hydrationModules);

                if (this.interactions.has(interaction.name)) throw new Error(`${fileName} has a duplicate interaction name`);
                this.interactions.set(interaction.name, interaction);
                Logger.infog(`${fileName} loaded`);
            };
        } catch (err) {
            Logger.error(err);
            success = false;
        }
        return success;
    }
    /**
     * @function loadCommands
     * @description Loads all the commands from the commands folder and its subfolders
     * @return {boolean} Success of the operation
     * @private
     */
    #loadCommands() {
        let success = true;
        try {
            const commandFolder = this.#loadFolder(this.#commandsPath);
            for (const { fileName, file: command } of commandFolder) {
                if (fileName.startsWith('_')) return Logger.infog(`${fileName} skipped`);
                if (!(command instanceof CommandBuilder)) return;

                command.hydrate(...this.#options, this.#hydrationModules);

                if (command.hasSlash) {
                    if (this.slashCommands.has(command.customId)) throw new Error(`${fileName} has a duplicate slash command id`);
                    this.slashCommands.set(command.customId, command.slash);
                };
                if (command.hasBetaSlash) {
                    if (this.betaSlashCommands.has(command.betaCustomId)) throw new Error(`${fileName} has a duplicate beta slash command id`);
                    this.betaSlashCommands.set(command.betaCustomId, command.betaSlash);
                };
                if (command.hasText) {
                    if (this.textCommands.has(command.name)) throw new Error(`${fileName} has a duplicate text command name`);
                    this.textCommands.set(command.name, command.text);
                    for (const alias of command.aliases) {
                        if (this.textCommands.has(alias)) throw new Error(`${fileName} has a duplicate text command alias`);
                        this.textCommands.set(alias, command.text);
                    };
                };
                Logger.infog(`${fileName} loaded`);
            };
        } catch (err) {
            Logger.error(err);
            success = false;
        }
        return success;
    }
    /**
     * @function exportCommands
     * @description Exports all the commands to a object of commands
     * @param {boolean} [beta=false] Whether to export beta commands or not
     * @return {object} The object of commands
     * @public
     * @example
     * const commands = client.exportCommands();
     * const betaCommands = client.exportCommands(true);
     */
    exportCommands(beta = false) {
        const commands = {};
        for (const [name, command] of beta ? this.betaSlashCommands : this.slashCommands) {
            commands[name] = JSON.stringify(command.data);
        };
        return commands;
    }
};

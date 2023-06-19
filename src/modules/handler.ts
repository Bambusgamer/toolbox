import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import Logger from './logger';
import {
    default as CommandBuilder,
    HydratedSlashCommand,
    HydratedBetaSlashCommand,
    HydratedContextMenuCommand,
    HydratedTextCommand,
} from '../classes/command';
import EventBuilder from '../classes/event';
import InteractionBuilder from '../classes/interaction';
import ServiceBuilder from '../classes/service';
import { ChatInputApplicationCommandData, MessageApplicationCommandData, UserApplicationCommandData } from 'discord.js';

interface Emitter {
    name: string;
    emitter: EventEmitter;
}

interface HandlerOptions {
    emitters: Emitter[];
    paths: { events?: string; commands?: string; interactions?: string; services?: string };
    modules?: Record<any, any>;
    options?: any[];
}

export default class Handler extends EventEmitter {
    #emitters: Emitter[] = [];

    #eventsPath: string | null = null;
    #commandsPath: string | null = null;
    #interactionsPath: string | null = null;
    #servicesPath: string | null = null;
    #oldstate: any = null;
    #eventWildCardCache: Map<string, string[]> = new Map();

    #hydrationArgs: any[] = [];

    events: Map<string, EventBuilder[]>;
    slashCommands: Map<string, HydratedSlashCommand>;
    betaSlashCommands: Map<string, HydratedBetaSlashCommand>;
    contextMenus: Map<string, HydratedContextMenuCommand>;
    textCommands: Map<string, HydratedTextCommand>;
    interactions: Map<string, InteractionBuilder>;
    services: Map<string, ServiceBuilder>;

    /**
     * @description Returns the path from where the Handler was called
     */
    #getInstPath(): string {
        const stack = new Error().stack as string;
        const frame = stack.split('\n')[3].trim().replace(/\\/g, '/');
        // Credits to discord@A7mooz#2962 for the regex
        const regex = /([A-Z]:)?((\/)([a-zA-Z0-9_ ]\.?)+)+\3/g;
        return (regex.exec(frame) as string[])[0];
    }

    /**
     * @description Matches a wildcard string to a string
     */
    matchWildcard(pattern: string, toMatch: string): boolean {
        const escapeRegex = (str: string) => str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
        return new RegExp('^' + pattern.split('*').map(escapeRegex).join('.*') + '$').test(toMatch);
    }

    /**
     * @description Initializes the handler module
     */
    constructor({ emitters = [], paths, modules = {}, options = [] }: HandlerOptions) {
        super();

        if (emitters) this.#emitters = emitters;

        const { events, commands, interactions, services } = paths;

        if (events) this.#eventsPath = path.join(this.#getInstPath(), events);
        if (commands) this.#commandsPath = path.join(this.#getInstPath(), commands);
        if (interactions) this.#interactionsPath = path.join(this.#getInstPath(), interactions);
        if (services) this.#servicesPath = path.join(this.#getInstPath(), services);

        if (options.length > 0) this.#hydrationArgs = [...options];

        if (Object.keys(modules).length > 0) this.#hydrationArgs = [...this.#hydrationArgs, modules];

        this.events = new Map();
        this.slashCommands = new Map();
        this.betaSlashCommands = new Map();
        this.contextMenus = new Map();
        this.textCommands = new Map();
        this.interactions = new Map();
        this.services = new Map();

        this.#patchEmitters();
        Logger.info('Handler module initialized');
    }

    /**
     * @description Stops all services
     */
    stopServices() {
        for (const service of this.services.values()) {
            service.stop();
        }
    }

    /**
     * @description Starts all services
     */
    startServices() {
        for (const service of this.services.values()) {
            if (service.autostart) service.start();
        }
    }

    /**
     * @description Patches an emitter to emit all events to a wildcard event
     */
    #patchEmitter(name: string, emitter: EventEmitter) {
        const oldEmit = emitter.emit;
        const self = this;
        emitter.emit = function (event: string, ...args: any[]): boolean {
            self.#emit(name, event, ...args);
            return oldEmit.call(this, event, ...args);
        };
    }

    /**
     * @description Patches all emitters to enable wildcard events
     */
    #patchEmitters() {
        for (const { name, emitter } of this.#emitters) {
            this.#patchEmitter(name, emitter);
        }
    }

    /**
     * @description Registers a service event
     */
    #registerServiceEvent(event: EventBuilder) {
        event.hydrate(...this.#hydrationArgs);

        let listeners = this.events.get(event.name);
        if (!listeners) {
            listeners = [event];
        } else listeners.push(event);
        this.events.set(event.name, listeners);
    }

    /**
     * @description Adds a service power event to the event list
     */
    #addServicePowerEvent({
        eventData,
        callback,
    }: {
        eventData: {
            event: string | null;
            once: boolean;
            emitter: string | null;
            matchCallback: (...args: any[]) => Promise<boolean> | boolean;
        };
        callback: (...options: any[]) => Promise<any> | any;
    }) {
        if (eventData.event)
            this.#registerServiceEvent(
                new EventBuilder({
                    name: eventData.event,
                    once: eventData.once,
                    emitter: eventData.emitter,
                    async callback(...args: any[]) {
                        try {
                            if (await eventData.matchCallback(...args)) callback(...args);
                        } catch (error) {
                            Logger.error('Error while executing service power event callback', error);
                        }
                    },
                }),
            );
    }

    /**
     * @description Returns all listeners with a wildcard that match the given event
     */
    #eventsWildcard(event: string): string[] {
        const cached = this.#eventWildCardCache.get(event);

        if (cached) return cached;

        const events = [];

        for (const [eventName, listeners] of this.events) {
            if (this.matchWildcard(eventName, event)) events.push(eventName);
        }

        this.#eventWildCardCache.set(event, events);
        return events;
    }

    /**
     * @description Emits an event to all subscribed listeners
     */
    #emit(emitter: string, event: string, ...args: any[]) {
        const matchedEvents = this.#eventsWildcard(event);

        for (const matchedEvent of matchedEvents) {
            const listeners = this.events.get(matchedEvent);
            if (!listeners) return;
            for (const listener of listeners) {
                if (typeof listener?.emitter === 'string' && listener.emitter !== emitter) continue;
                try {
                    listener.callback(...args);
                } catch (err) {
                    Logger.error([err, `Error in event ${matchedEvent}`]);
                }
            }

            this.events.set(
                matchedEvent,
                listeners.filter((listener) => {
                    if (typeof listener?.emitter === 'string' && listener.emitter !== emitter) return true;
                    return !listener?.once;
                }),
            );
        }
    }

    /**
     * @description Loads all events, commands and interactions. Returns true if all loaded successfully
     */
    load(): boolean {
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
        if (this.#servicesPath) {
            Logger.infoy('\nServices:');
            success = this.#loadServices() && success;
        }
        if (this.#commandsPath || this.#interactionsPath || this.#eventsPath || this.#servicesPath) Logger.newline();
        if (!success) {
            Logger.warn('Handler failed to load');
            this.#restore();
        }
        this.startServices();
        return success;
    }

    /**
     * @description Moves all loaded events, commands and interactions to the old state and clears the current state
     */
    #clear() {
        this.stopServices();

        this.#oldstate = {
            events: new Map(this.events),
            eventWildCardCache: new Map(this.#eventWildCardCache),
            slashCommands: new Map(this.slashCommands),
            betaSlashCommands: new Map(this.betaSlashCommands),
            contextMenus: new Map(this.contextMenus),
            textCommands: new Map(this.textCommands),
            interactions: new Map(this.interactions),
            services: new Map(this.services),
        };
        this.events.clear();
        this.#eventWildCardCache.clear();
        this.slashCommands.clear();
        this.betaSlashCommands.clear();
        this.contextMenus.clear();
        this.textCommands.clear();
        this.interactions.clear();
        this.services.clear();
    }

    /**
     * @description Reloads all the events, commands and interactions. Returns true if successful
     */
    reload(): boolean {
        this.#clear();
        return this.load();
    }

    /**
     * @description Restores the old state
     */
    #restore() {
        if (this.#oldstate) {
            this.events = this.#oldstate.events;
            this.#eventWildCardCache = this.#oldstate.eventWildCardCache;
            this.slashCommands = this.#oldstate.slashCommands;
            this.betaSlashCommands = this.#oldstate.betaSlashCommands;
            this.contextMenus = this.#oldstate.contextMenus;
            this.textCommands = this.#oldstate.textCommands;
            this.interactions = this.#oldstate.interactions;
            this.services = this.#oldstate.services;
            Logger.infoy('Restored old state');
        }
    }

    /**
     * @description Loads a file
     */
    #loadFile(filePath: string): { fileName: string; file: any } {
        delete require.cache[require.resolve(filePath)];
        let file = require(filePath);
        if (file.default) file = file.default;
        return {
            fileName: ((filePath.split('\\').pop() as string).split('/').pop() as string).split('.')[0],
            file,
        };
    }

    /**
     * @description Loads a folder
     */
    #loadFolder(folderPath: string): { fileName: string; file: any }[] {
        const elements = fs.readdirSync(folderPath, { withFileTypes: true });
        const folders = elements.filter((element) => element.isDirectory());
        const files = elements.filter((element) => element.isFile()).filter((element) => element.name.endsWith('.js'));
        return [
            ...files.map((file) => this.#loadFile(folderPath + '/' + file.name)),
            ...folders.map((folder) => this.#loadFolder(folderPath + '/' + folder.name)).flat(),
        ];
    }

    /**
     * @description Loads all modules of a given type
     */
    #loadModules(modulesPath: string | null, type: any, callback: (fileName: string, hydrated: any) => void): boolean {
        let success = true;
        try {
            if (modulesPath) {
                for (const { fileName, file } of this.#loadFolder(modulesPath)) {
                    if (fileName.startsWith('_')) {
                        Logger.infog(`${fileName} skipped`);
                        continue;
                    }
                    if (!(file instanceof type)) continue;

                    file.hydrate(...this.#hydrationArgs);

                    callback(fileName, file);

                    Logger.infog(`${fileName} loaded`);
                }
            }
        } catch (err) {
            Logger.error(err);
            success = false;
        }
        return success;
    }

    /**
     * @description Loads all the events from the events folder and its subfolders
     */
    #loadEvents(): boolean {
        return this.#loadModules(this.#eventsPath, EventBuilder, (fileName, event: EventBuilder) => {
            let listeners = this.events.get(event.name);
            if (!listeners) {
                listeners = new Array(event);
            } else listeners.push(event);
            this.events.set(event.name, listeners);
        });
    }

    /**
     * @description Loads all the interactions from the interactions folder and its subfolders
     */
    #loadInteractions(): boolean {
        return this.#loadModules(
            this.#interactionsPath,
            InteractionBuilder,
            (fileName, interaction: InteractionBuilder) => {
                if (this.interactions.has(interaction.name)) throw new Error(`${fileName} has a duplicate customId`);
                this.interactions.set(interaction.name, interaction);
            },
        );
    }

    /**
     * @description Loads all the commands from the commands folder and its subfolders
     */
    #loadCommands(): boolean {
        return this.#loadModules(this.#commandsPath, CommandBuilder, (fileName, command: CommandBuilder) => {
            if (command.slash && command.slashName) {
                if (this.slashCommands.has(command.slashName))
                    throw new Error(`${fileName} has a duplicate slash command name`);
                this.slashCommands.set(command.slashName, command.slash);
            }
            if (command.betaSlash && command.betaSlashName) {
                if (this.betaSlashCommands.has(command.betaSlashName))
                    throw new Error(`${fileName} has a duplicate beta slash command name`);
                this.betaSlashCommands.set(command.betaSlashName, command.betaSlash);
            }
            if (command.contextMenu && command.contextMenuName) {
                if (this.contextMenus.has(command.contextMenuName))
                    throw new Error(`${fileName} has a duplicate context menu command name`);
                this.contextMenus.set(command.contextMenuName, command.contextMenu);
            }
            if (command.text && command.name) {
                if (this.textCommands.has(command.name))
                    throw new Error(`${fileName} has a duplicate text command name`);
                this.textCommands.set(command.name, command.text);
                if (command.aliases) {
                    for (const alias of command.aliases) {
                        if (this.textCommands.has(alias))
                            throw new Error(`${fileName} has a duplicate text command alias`);
                        this.textCommands.set(alias, command.text);
                    }
                }
            }
        });
    }

    /**
     * @description Loads all the services from the services folder and its subfolders
     */
    #loadServices(): boolean {
        return this.#loadModules(this.#servicesPath, ServiceBuilder, (fileName, service: ServiceBuilder) => {
            if (this.services.has(service.id)) throw new Error(`${fileName} has a duplicate service id`);

            this.#addServicePowerEvent({
                eventData: service.startup,
                callback: () => {
                    service.start();
                },
            });
            this.#addServicePowerEvent({
                eventData: service.shutdown,
                callback: () => {
                    service.stop();
                },
            });

            this.services.set(service.id, service);
        });
    }

    /**
     * @description Exports all the commands to a object of commands
     */
    exportCommands() {
        const commands: Record<string, ChatInputApplicationCommandData> = {};
        for (const [name, command] of this.slashCommands) {
            commands[name] = command.data;
        }
        return commands;
    }

    /**
     * @description Exports all the beta commands to a object of commands
     */
    exportBetaCommands() {
        const commands: Record<string, ChatInputApplicationCommandData> = {};
        for (const [name, command] of this.betaSlashCommands) {
            commands[name] = command.data;
        }
        return commands;
    }

    /**
     * @description Exports all the context menus to a object of commands
     */
    exportContextMenus() {
        const commands: Record<string, UserApplicationCommandData | MessageApplicationCommandData> = {};
        for (const [name, command] of this.contextMenus) {
            commands[name] = command.data;
        }
        return commands;
    }
}

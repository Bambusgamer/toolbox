// eslint-disable-next-line no-unused-vars
const {
    Client,
    PermissionFlagsBits,
} = require('discord.js');
const Logger = require('../modules/logger');
const Config = require('../modules/config');
const Localizer = require('../modules/localizer');
const builders = require('../util/builders');
const modules = {
    Logger,
    Config,
    Localizer,
    ...builders,
    perms: PermissionFlagsBits,
};

/**
 * The base class for all events
 */
class EventBuilder {
    static modules = modules;
    /**
     * Creates a new Event
     * @param {object} obj The event
     * @param {string} obj.name The name of the event the {Client} emits
     * @param {Boolean} obj.once Whether the event should only be emitted once
     * @param {function} obj.callback The event data
     * @param {object} obj.callback.modules The modules
     * @param {Client} obj.callback.client The client
     */
    constructor({ name, once = false, emitter = null, callback, ...options }) {
        if (!name || typeof name !== 'string') throw new Error('Invalid event name');
        if (emitter && typeof emitter !== 'string') throw new Error('Invalid event emitter');
        if (!callback || typeof callback !== 'function') throw new Error('Invalid event callback');
        this.name = name;
        this.once = once;
        this.emitter = emitter;
        this.callback = callback;
        for (const [key, value] of Object.entries(options)) {
            this[key] = value;
        }
    }

    /**
     * Hydrates the event
     * @param {Client} client The client
     */
    hydrate(client) {
        if (!client) throw new Error('Client is required to hydrate command');
        if (!(client instanceof Client)) throw new Error('Client must be an instance of Discord.Client');
        this.callback = this.callback.bind(null, client, EventBuilder.modules);
    }
};

module.exports = EventBuilder;

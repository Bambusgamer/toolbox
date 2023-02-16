// eslint-disable-next-line no-unused-vars
const { Client } = require('discord.js');

/**
 * The base class for all events
 */
class EventBuilder {
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
     * @param {object} modules The modules
     */
    hydrate(client, modules) {
        if (!client) throw new Error('Client is required to hydrate command');
        if (!(client instanceof Client)) throw new Error('Client must be an instance of Discord.Client');
        this.callback = this.callback.bind(null, client, modules);
    }
};

module.exports = EventBuilder;

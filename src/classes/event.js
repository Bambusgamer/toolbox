/**
 * @class EventBuilder
 * @description The base class for all events
 */
class EventBuilder {
    /**
     * @description Creates a new Event
     * @param {object} obj The event
     * @param {string} obj.name The name of the event the {Client} emits
     * @param {Boolean} obj.once Whether the event should only be emitted once
     * @param {function} obj.callback The callback of the event
     * @constructor
     * @example
     * const { EventBuilder } = require('@bambusgamer/toolbox');
     *
     * module.exports = new EventBuilder({
     *    name: 'ready',
     *    once: true,
     *    async callback(client, modules) {
     *       console.info('Bot is ready!');
     *    },
     * });
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
     * @function hydrate
     * @description Hydrates the event
     * @param {*} options The options to hydrate the event with
     * @return {void}
     */
    hydrate(...options) {
        this.callback = this.callback.bind(null, ...options);
    }
};

module.exports = EventBuilder;

// eslint-disable-next-line no-unused-vars
const { Client } = require('discord.js');
const Logger = require('../modules/logger');
const Config = require('../modules/config');
const Localizer = require('../modules/localizer');
const {
    ActionRow,
    Embed,
    Button,
    SelectMenu,
    TextInput,
    Modal,
} = require('../util/builders');
const modules = {
    Logger,
    Config,
    Localizer,
    ActionRow,
    Embed,
    Button,
    SelectMenu,
    TextInput,
    Modal,
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
        this.callback = callback.bind(null, EventBuilder.modules);
        for (const [key, value] of Object.entries(options)) {
            this[key] = value;
        }
    }
};

module.exports = EventBuilder;

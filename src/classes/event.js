// eslint-disable-next-line no-unused-vars
const { Client } = require('discord.js');
const Logger = require('../modules/logger');
const Config = require('../modules/config');
const {
    Embed,
    Button,
    SelectMenu,
    TextInput,
    Modal,
} = require('../util/builders');
const modules = {
    Logger,
    Config,
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
    constructor({ name, once = false, callback }) {
        this.name = name;
        this.once = once;
        this.callback = callback.bind(null, EventBuilder.modules);
    }
};

module.exports = EventBuilder;

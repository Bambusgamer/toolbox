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

module.exports = class EventBuilder {
    static modules = modules;
    /**
     * Creates a new Event
     * @param {string} name The name of the event the {Client} emits
     * @param {Boolean} once Whether the event should only be emitted once
     * @param {function} callback The event data
     * @param {Client} callback.client The client
     */
    constructor(name, once, callback) {
        this.name = name;
        this.once = once;
        this.callback = callback.bind(null, EventBuilder.modules);
    }
};


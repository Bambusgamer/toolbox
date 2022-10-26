// eslint-disable-next-line no-unused-vars
const { Client } = require('discord.js');

module.exports = class EventBuilder {
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
        this.callback = callback;
    }
};


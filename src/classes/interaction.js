/* eslint-disable no-unused-vars */
const { Client, Interaction } = require('discord.js');

/**
 * The base class for all interactions
 */
class InteractionBuilder {
    /**
     * Creates a new Interaction
     * @param {object} obj The interaction
     * @param {string} obj.customId The customId of the interaction
     * @param {function} obj.callback The interaction data
     * @param {Client} obj.callback.client The client
     * @param {Interaction} obj.callback.interaction The interaction
     */
    constructor({ customId, callback, ...options }) {
        if (!customId || typeof customId !== 'string') throw new Error('Invalid interaction customId');
        if (!callback || typeof callback !== 'function') throw new Error('Invalid interaction callback');
        this.customId = customId;
        this.callback = callback;
        for (const [key, value] of Object.entries(options)) {
            this[key] = value;
        }
    }

    /**
     * Hydrates the interaction
     * @param {Client} client The client
     * @param {object} modules The modules
     * @return {void}
     */
    hydrate(client, modules) {
        if (!client) throw new Error('Client is required to hydrate command');
        if (!(client instanceof Client)) throw new Error('Client must be an instance of Discord.Client');
        this.callback = this.callback.bind(null, client, modules);
    }

    /**
     * Returns the name associated with the interaction
     * @return {string}
     */
    get name() {
        return this.customId;
    }
};

module.exports = InteractionBuilder;

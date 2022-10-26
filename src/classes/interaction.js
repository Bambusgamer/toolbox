// eslint-disable-next-line no-unused-vars
const { Client, Integration } = require('discord.js');

module.exports = class Interaction {
    /**
     * Creates a new Interaction
     * @param {string} customId The customId of the interaction
     * @param {function} callback The interaction data
     * @param {Client} callback.client The client
     * @param {Interaction} callback.interaction The interaction
     */
    constructor(customId, callback) {
        this.customId = customId;
        this.callback = callback;
    }
    /**
     * Returns the name associated with the interaction
     * @return {string}
     */
    get name() {
        return this.customId;
    }
};

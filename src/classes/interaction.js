// eslint-disable-next-line no-unused-vars
const { Client, Interaction } = require('discord.js');
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
 * The base class for all interactions
 */
class InteractionBuilder {
    static modules = modules;
    /**
     * Creates a new Interaction
     * @param {object} obj The interaction
     * @param {string} obj.customId The customId of the interaction
     * @param {function} obj.callback The interaction data
     * @param {Client} obj.callback.client The client
     * @param {Interaction} obj.callback.interaction The interaction
     */
    constructor({ customId, callback }) {
        this.customId = customId;
        this.callback = callback.bind(null, InteractionBuilder.modules);
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

// eslint-disable-next-line no-unused-vars
const { Client, Interaction } = require('discord.js');
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
    constructor({ customId, callback, ...options }) {
        if (!customId || typeof customId !== 'string') throw new Error('Invalid interaction customId');
        if (!callback || typeof callback !== 'function') throw new Error('Invalid interaction callback');
        this.customId = customId;
        this.callback = callback.bind(null, InteractionBuilder.modules);
        for (const [key, value] of Object.entries(options)) {
            this[key] = value;
        }
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

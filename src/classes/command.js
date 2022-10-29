/* eslint-disable no-unused-vars */
const {
    Client,
    Message,
    SlashCommandBuilder,
    PermissionFlagsBits,
    CommandInteraction,
} = require('discord.js');
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
    perms: PermissionFlagsBits,
};


/**
 * The base class for all commands
 * @abstract
 * @class
 */
class CommandBuilder {
    static modules = modules;
    /**
     * Checks if a slash command is present
     * @return {boolean}
     */
    get hasSlash() {
        return Boolean(this.slash);
    }
    /**
     * Checks if a beta slash command is present
     * @return {boolean}
     */
    get hasBetaSlash() {
        return Boolean(this.betaSlash);
    }
    /**
     * Checks if a text command is present
     * @return {boolean}
     */
    get hasText() {
        return Boolean(this.text);
    }

    /**
     * Creates a new Command and hydrates the command data
     * @param {object} obj The object to check
     * @param {object} obj.slash The slash command data
     * @param {object} obj.betaSlash The beta slash command data
     * @param {object} obj.text The text command data
     * @param {function} obj.slash.data The slash command builder
     * @param {function} obj.slash.autocomplete The slash command autocomplete callback
     * @param {function} obj.slash.callback The slash command callback
     * @param {function} obj.betaSlash.data The beta slash command builder
     * @param {function} obj.betaSlash.autocomplete The beta slash command autocomplete callback
     * @param {function} obj.betaSlash.callback The beta slash command callback
     * @param {function} obj.text.data The text command builder
     * @param {function} obj.text.callback The text command callback
     */
    constructor({ slash, betaSlash, text }) {
        if (slash && typeof slash !== 'object') throw new Error('Invalid slash command data');
        if (betaSlash && typeof betaSlash !== 'object') throw new Error('Invalid beta slash command data');
        if (text && typeof text !== 'object') throw new Error('Invalid text command data');
        if (slash && !slash.data || typeof slash.data !== 'function') throw new Error('Slash command data must have a data function');
        if (slash && slash?.autocomplete && typeof slash.autocomplete !== 'function') throw new Error('Slash command autocomplete must be of type function');
        if (slash && slash.callback || typeof slash.callback !== 'function') throw new Error('Slash command data must have a callback function');
        if (betaSlash && !betaSlash.data || typeof betaSlash.data !== 'function') throw new Error('Beta slash command data must have a data function');
        if (betaSlash && betaSlash?.autocomplete && typeof betaSlash.autocomplete !== 'function') throw new Error('Beta slash command autocomplete must be of type function');
        if (betaSlash && !betaSlash.callback || typeof betaSlash.callback !== 'function') throw new Error('Beta slash command data must have a callback function');
        if (text && !text.data || typeof text.data !== 'function') throw new Error('Text command data must have a data function');
        if (text && !text.callback || typeof text.callback !== 'function') throw new Error('Text command data must have a callback function');
        this.slash = slash || null;
        this.betaSlash = betaSlash || null;
        this.text = text || null;
    }

    /**
     * Hydrates the slash command builder
     * Must be called before the command is registered
     * @param {Client} client The client
     * @return {void}
     */
    hydrate(client) {
        if (!client) throw new Error('Client is required to hydrate command');
        if (!(client instanceof Client)) throw new Error('Client must be an instance of Discord.Client');
        if (this.hasSlash) {
            this.slash.data = this.slash.data(new SlashCommandBuilder(), client, CommandBuilder.modules);
            if (this.slash.autocomplete) this.slash.autocomplete = this.slash.autocomplete.bind(null, CommandBuilder.modules);
            this.slash.callback = this.slash.callback.bind(null, CommandBuilder.modules);
        }
        if (this.hasBetaSlash) {
            this.betaSlash.data = this.betaSlash.data(new SlashCommandBuilder(), client, CommandBuilder.modules);
            if (this.betaSlash.autocomplete) this.betaSlash.autocomplete = this.betaSlash.autocomplete.bind(null, CommandBuilder.modules);
            this.betaSlash.callback = this.betaSlash.callback.bind(null, CommandBuilder.modules);
        }
        if (this.hasText) {
            this.text.data = this.text.data(client, CommandBuilder.modules);
            this.text.callback = this.text.callback.bind(null, CommandBuilder.modules);
        }
    }

    /**
     * Returns the customId associated with the command
     * @return {string}
     */
    get customId() {
        return this.slash?.data?.name || null;
    }

    /**
     * Returns the customId associated with the beta command
     * @return {string}
     */
    get betaCustomId() {
        return this.betaSlash?.data?.name || null;
    }

    /**
     * Returns the name associated with the command
     * @return {string}
     */
    get name() {
        return this.text?.data?.name || null;
    }

    /**
     * Returns the aliases associated with the command
     * @return {Array<string>}
     */
    get aliases() {
        return this.text?.data?.aliases || null;
    }
};

module.exports = CommandBuilder;

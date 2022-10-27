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
const supportClasses = {
    Logger,
    Config,
    Embed,
    Button,
    SelectMenu,
    TextInput,
    Modal,
};

module.exports = class CommandBuilder {
    static supportClasses = supportClasses;
    /**
     * Checks if a slash command is present
     * @return {boolean}
     */
    get hasSlash() {
        return Boolean(this.global);
    }
    /**
     * Checks if a beta slash command is present
     * @return {boolean}
     */
    get hasBetaSlash() {
        return Boolean(this.beta);
    }
    /**
     * Checks if a text command is present
     * @return {boolean}
     */
    get hasText() {
        return Boolean(this.text);
    }

    /**
     * @typedef {function} SlashCommandDataBuilder
     * @param {SlashCommandBuilder} builder The slash command builder
     * @param {Client} client The client
     * @param {object} supportClasses The support classes
     * @return {SlashCommandBuilder} Hydrated slash command builder
     */

    /**
     * @typedef {object} CommandData
     * @property {string} name The name of the command
     * @property {Array<string>} aliases The aliases of the command
     * @property {string} category The category of the command
     * @property {Array<PermissionFlagsBits>} permissions The permissions required of the user (null if authorized only)
     * @property {string} description The description of the command
     * @property {string} usage The usage of the command
     * @property {string} example The example of the command
     * @property {boolean} guildOnly Whether the command can only be used in a guild
     * @property {boolean} dmOnly Whether the command can only be used in a DM
     */

    /**
     * @typedef {function} CommandDataBuilder
     * @param {Client} client The client
     * @param {object} supportClasses The support classes
     * @return {CommandData} The command data
     */


    /**
     * Constructs a new Command
     * @param {object} slash The global commands data and callback
     * @param {SlashCommandDataBuilder} global.data The global slash command data
     * @param {function} slash.callback The global slash command callback
     * @param {supportClasses} slash.callback.supportClasses The support classes
     * @param {Client} slash.callback.client The client
     * @param {CommandInteraction} slash.callback.interaction The interaction
     * @param {object} betaSlash The beta commands data and callback
     * @param {SlashCommandDataBuilder} betaSlash.data The beta slash command data
     * @param {function} betaSlash.callback The beta slash command callback
     * @param {supportClasses} betaSlash.callback.supportClasses The support classes
     * @param {Client} betaSlash.callback.client The client
     * @param {CommandInteraction} betaSlash.callback.interaction The interaction
     * @param {object} text The text commands data and callback
     * @param {CommandDataBuilder} text.data The text command data
     * @param {function} text.callback The text command callback
     * @param {supportClasses} text.callback.supportClasses The support classes
     * @param {Client} text.callback.client The client
     * @param {Message} text.callback.message The message
     * @param {string[]} text.callback.args The arguments
     * @constructor
     */
    constructor(slash, betaSlash, text) {
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
            this.slash.data = this.slash.data(new SlashCommandBuilder(), client, CommandBuilder.supportClasses);
            this.slash.callback = this.slash.callback.bind(null, CommandBuilder.supportClasses);
        }
        if (this.hasBetaSlash) {
            this.betaSlash.data = this.betaSlash.data(new SlashCommandBuilder(), client, CommandBuilder.supportClasses);
            this.betaSlash.callback = this.betaSlash.callback.bind(null, CommandBuilder.supportClasses);
        }
        if (this.hasText) {
            this.text.data = this.text.data(client, CommandBuilder.supportClasses);
            this.text.callback = this.text.callback.bind(null, CommandBuilder.supportClasses);
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

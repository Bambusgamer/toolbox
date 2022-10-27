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
};

module.exports = class CommandBuilder {
    static modules = modules;
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
     * @param {object} commands The commands
     * @param {object} commands.slash The global commands data and callback
     * @param {SlashCommandDataBuilder} commands.slash.data The global slash command data
     * @param {function} commands.slash.callback The global slash command callback
     * @param {supportClasses} commands.slash.callback.supportClasses The support classes
     * @param {Client} commands.slash.callback.client The client
     * @param {CommandInteraction} commands.slash.callback.interaction The interaction
     * @param {object} commands.betaSlash The beta commands data and callback
     * @param {SlashCommandDataBuilder} commands.betaSlash.data The beta slash command data
     * @param {function} commands.betaSlash.callback The beta slash command callback
     * @param {supportClasses} commands.betaSlash.callback.supportClasses The support classes
     * @param {Client} commands.betaSlash.callback.client The client
     * @param {CommandInteraction} commands.betaSlash.callback.interaction The interaction
     * @param {object} commands.text The text commands data and callback
     * @param {CommandDataBuilder} commands.text.data The text command data
     * @param {function} commands.text.callback The text command callback
     * @param {supportClasses} commands.text.callback.supportClasses The support classes
     * @param {Client} commands.text.callback.client The client
     * @param {Message} commands.text.callback.message The message
     * @param {string[]} commands.text.callback.args The arguments
     * @constructor
     */
    constructor(commands) {
        this.slash = commands?.slash || null;
        this.betaSlash = commands?.betaSlash || null;
        this.text = commands?.text || null;
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
            this.slash.callback = this.slash.callback.bind(null, CommandBuilder.modules);
        }
        if (this.hasBetaSlash) {
            this.betaSlash.data = this.betaSlash.data(new SlashCommandBuilder(), client, CommandBuilder.modules);
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

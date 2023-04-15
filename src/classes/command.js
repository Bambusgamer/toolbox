/**
 * @class CommandBuilder
 * @description The base class for all commands
 */
class CommandBuilder {
    /**
     * @function hasSlash
     * @description Checks if a slash command is present
     * @return {boolean} Whether a slash command is present
     */
    get hasSlash() {
        return Boolean(this.slash);
    }
    /**
     * @function hasBetaSlash
     * @description Checks if a beta slash command is present
     * @return {boolean} Whether a beta slash command is present
     */
    get hasBetaSlash() {
        return Boolean(this.betaSlash);
    }
    /**
     * @function hasText
     * @description Checks if a text command is present
     * @return {boolean} Whether a text command is present
     */
    get hasText() {
        return Boolean(this.text);
    }

    /**
     * @description Creates a new Command and hydrates the command data
     * @param {object} obj The object to check
     * @param {object} obj.slash The slash command data
     * @param {object} obj.betaSlash The beta slash command data
     * @param {object} obj.text The text command data
     * @constructor
     * @example
     * const { CommandBuilder } = require('@bambusgamer/toolbox');
     *
     * module.exports = new CommandBuilder({
     *    slash: {
     *       data: () => ({
     *         name: 'ping',
     *         description: 'Ping! Pong!'
     *      }),
     *      async callback(client, modules, interaction) {
     *        await interaction.reply('Pong!');
     *      }
     *    },
     * });
     */
    constructor({ slash = null, betaSlash = null, text = null }) {
        if (slash && typeof slash !== 'object') throw new Error('Invalid slash command data');
        if (betaSlash && typeof betaSlash !== 'object') throw new Error('Invalid beta slash command data');
        if (text && typeof text !== 'object') throw new Error('Invalid text command data');
        if (slash && (!slash?.data || typeof slash?.data !== 'function')) throw new Error('Slash command data must have a data function');
        if (slash && slash?.autocomplete && typeof slash?.autocomplete !== 'function') throw new Error('Slash command autocomplete must be of type function');
        if (slash && (!slash?.callback || typeof slash?.callback !== 'function')) throw new Error('Slash command data must have a callback function');
        if (betaSlash && (!betaSlash?.data || typeof betaSlash?.data !== 'function')) throw new Error('Beta slash command data must have a data function');
        if (betaSlash && betaSlash?.autocomplete && typeof betaSlash?.autocomplete !== 'function') throw new Error('Beta slash command autocomplete must be of type function');
        if (betaSlash && (!betaSlash?.callback || typeof betaSlash?.callback !== 'function')) throw new Error('Beta slash command data must have a callback function');
        if (text && (!text?.data || typeof text?.data !== 'function')) throw new Error('Text command data must have a data function');
        if (text && (!text?.callback || typeof text?.callback !== 'function')) throw new Error('Text command data must have a callback function');
        this.slash = slash;
        this.betaSlash = betaSlash;
        this.text = text;
    }

    /**
     * Hydrates the slash command builder
     * Must be called before the command is registered
     * @param {*} options The options to hydrate the command with
     * @return {void}
     */
    hydrate(...options) {
        if (this.hasSlash) {
            this.slash.data = this.slash.data(...options);
            if (this.slash.autocomplete) this.slash.autocomplete = this.slash.autocomplete.bind(null, ...options);
            this.slash.callback = this.slash.callback.bind(null, ...options);
        }
        if (this.hasBetaSlash) {
            this.betaSlash.data = this.betaSlash.data(...options);
            if (this.betaSlash.autocomplete) this.betaSlash.autocomplete = this.betaSlash.autocomplete.bind(null, ...options);
            this.betaSlash.callback = this.betaSlash.callback.bind(null, ...options);
        }
        if (this.hasText) {
            this.text.data = this.text.data(...options);
            this.text.callback = this.text.callback.bind(null, ...options);
        }
    }

    /**
     * @function customId
     * @description Returns the customId associated with the command
     * @return {string} The customId
     */
    get customId() {
        return this.slash?.data?.name || null;
    }

    /**
     * @function betaCustomId
     * @description Returns the beta customId associated with the command
     * @return {string} The beta customId
     */
    get betaCustomId() {
        return this.betaSlash?.data?.name || null;
    }

    /**
     * @function name
     * @description Returns the name associated with the command
     * @return {string} The name
     */
    get name() {
        return this.text?.data?.name || null;
    }

    /**
     * @function aliases
     * @description Returns the aliases associated with the command
     * @return {Array<string>} The aliases
     */
    get aliases() {
        return this.text?.data?.aliases || null;
    }
};

module.exports = CommandBuilder;

/**
 * @class InteractionBuilder
 * @description The base class for all interactions
 */
class InteractionBuilder {
    /**
     * @description Creates a new Interaction
     * @param {object} obj The interaction
     * @param {string} obj.customId The customId of the interaction
     * @param {function} obj.callback The callback of the interaction
     * @constructor
     * @example
     * const { InteractionBuilder } = require('@bambusgamer/toolbox');
     *
     * module.exports = new InteractionBuilder({
     *   customId: 'test',
     *   async callback(interaction, modules) {
     *      await interaction.reply('Test');
     *   }
     * });
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
     * @function hydrate
     * @description Hydrates the interaction
     * @param {*} options The options to hydrate the interaction with
     * @return {void}
     */
    hydrate(...options) {
        this.callback = this.callback.bind(null, ...options);
    }

    /**
     * @function name
     * @description Returns the name associated with the interaction
     * @return {string} The customId of the interaction
     */
    get name() {
        return this.customId;
    }
};

module.exports = InteractionBuilder;

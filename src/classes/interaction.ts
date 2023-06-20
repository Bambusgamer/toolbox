interface InteractionOptions {
    customId: string;
    callback: (...args: any[]) => Promise<any> | any;
    options?: any;
}

export default class InteractionBuilder {
    customId: string;
    callback: (...args: any[]) => Promise<any> | any;
    options: any;

    /**
     * @description Creates a new Interaction
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
    constructor({ customId, callback, options = {} }: InteractionOptions) {
        this.customId = customId;
        this.callback = callback;

        this.options = options;
    }

    /**
     * @description Hydrates the interaction
     */
    hydrate(...options: any[]) {
        this.callback = this.callback.bind(null, ...options);
    }

    /**
     * @description Returns the name associated with the interaction
     */
    get name(): string {
        return this.customId;
    }
}

interface InteractionOptions {
    customId: string;
    callback: (...args: any[]) => Promise<any> | any;
    [key: string]: any;
}

export default class InteractionBuilder {
    customId: string;
    callback: (...args: any[]) => Promise<any> | any;
    [key: string]: any;

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
    constructor({ customId, callback, ...options }: InteractionOptions) {
        if (!customId || typeof customId !== 'string') throw new Error('Invalid interaction customId');
        if (!callback || typeof callback !== 'function') throw new Error('Invalid interaction callback');
        this.customId = customId;
        this.callback = callback;
        for (const [key, value] of Object.entries(options)) {
            this[key] = value;
        }
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

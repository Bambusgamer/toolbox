interface EventOptions {
    name: string;
    once?: boolean;
    emitter?: string | null;
    callback: (...options: any[]) => Promise<any> | any;
    options?: any;
}

export default class EventBuilder {
    name: string;
    once: boolean;
    emitter: string | null;
    callback: (...args: any[]) => Promise<any> | any;
    [key: string]: any;

    /**
     * @description Creates a new Event
     * @example
     * const { EventBuilder } = require('@bambusgamer/toolbox');
     *
     * module.exports = new EventBuilder({
     *    name: 'ready',
     *    once: true,
     *    async callback(client, modules) {
     *       console.info('Bot is ready!');
     *    },
     * });
     */
    constructor({ name, once = false, emitter = null, callback, ...options }: EventOptions) {
        this.name = name;
        this.once = once;
        this.emitter = emitter;
        this.callback = callback;
        for (const [key, value] of Object.entries(options)) {
            this[key] = value;
        }
    }

    /**
     * @description Hydrates the event
     */
    hydrate(...options: any[]) {
        this.callback = this.callback.bind(null, ...options);
    }
}

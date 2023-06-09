import { CronJob } from 'cron';

interface ServiceOptions {
    id: string;
    cron: string;
    callback: (...options: any[]) => Promise<any> | any;
    options?: any;
}

export default class ServiceBuilder {
    id: string;
    cron: string;
    callback: (...args: any[]) => Promise<any> | any;
    [key: string]: any;

    private job: CronJob | undefined;

    /**
     * @description Creates a new Service
     * @example
     * const { EventBuilder } = require('@bambusgamer/toolbox');
     *
     * module.exports = new ServiceBuilder({
     *    id: 'guildSizePrinter',
     *    cron: '*\/5 * * * *',
     *    async callback(client) {
     *       console.info(client.guilds.cache.size);
     *    },
     * });
     */
    constructor({ id, cron, callback, ...options }: ServiceOptions) {
        if (!id || typeof id !== 'string') throw new Error('Invalid service id');
        if (!cron && typeof cron !== 'string') throw new Error('Invalid service cron');
        if (!callback || typeof callback !== 'function') throw new Error('Invalid service callback');
        if (options && typeof options !== 'object') throw new Error('Invalid service options');

        this.id = id;
        this.cron = cron;
        this.callback = callback;

        for (const [key, value] of Object.entries(options)) {
            this[key] = value;
        }
    }

    /**
     * @description Hydrates the service
     */
    hydrate(...options: any[]) {
        this.callback = this.callback.bind(null, ...options);
    }

    /**
     * @description Starts the service
     */
    start() {
        if (!this.job) {
            this.job = new CronJob(this.cron, () => this.callback());
            this.job.start();
        }
    }

    /**
     * @description Stops the service
     */
    stop() {
        if (this.job) {
            this.job.stop();
            this.job = undefined;
        }
    }
}

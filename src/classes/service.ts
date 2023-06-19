import { CronJob } from 'cron';
import Logger from '../modules/logger';

interface ServiceOptions {
    id: string;
    cron: string;
    startup?: {
        event: string | null;
        once?: boolean;
        emitter?: string | null;
        matchCallback?: (...args: any[]) => Promise<boolean> | boolean;
    };
    shutdown?: {
        event: string | null;
        once?: boolean;
        emitter?: string | null;
        matchCallback?: (...args: any[]) => Promise<boolean> | boolean;
    };
    preRun?: (...args: any[]) => Promise<boolean> | boolean;
    callback: (...options: any[]) => Promise<any> | any;
    options?: any;
}

export default class ServiceBuilder {
    id: string;
    cron: string;
    autostart: boolean = true;
    startup: {
        event: string | null;
        once: boolean;
        emitter: string | null;
        matchCallback: (...args: any[]) => Promise<boolean> | boolean;
    };
    shutdown: {
        event: string | null;
        once: boolean;
        emitter: string | null;
        matchCallback: (...args: any[]) => Promise<boolean> | boolean;
    };
    preRun: (...args: any[]) => Promise<boolean> | boolean;
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
    constructor({ id, cron, preRun, callback, startup, shutdown, ...options }: ServiceOptions) {
        this.id = id;
        this.cron = cron;
        this.callback = callback;

        const powerConfig = { event: null, once: false, emitter: null, matchCallback: () => true };
        const startupConfig = { ...powerConfig, ...startup };
        const shutdownConfig = { ...powerConfig, ...shutdown };

        this.startup = startupConfig;
        this.shutdown = shutdownConfig;
        this.preRun = preRun || (() => true);

        if (typeof startupConfig.event === 'string') this.autostart = false;

        for (const [key, value] of Object.entries(options)) {
            this[key] = value;
        }
    }

    /**
     * @description Hydrates the service
     */
    hydrate(...options: any[]) {
        this.callback = this.callback.bind(null, ...options);
        this.preRun = this.preRun.bind(null, ...options);
    }

    /**
     * @description Starts the service
     */
    start() {
        if (!this.job) {
            this.job = new CronJob(this.cron, async () => {
                try {
                    if (await this.preRun()) await this.callback();
                } catch (error) {
                    Logger.error('Error while running preRun of service', error);
                }
            });
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

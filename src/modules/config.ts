import path from 'path';
import Logger from './logger';

export default class Config {
    /**
     * @description Returns the path from where the Handler was called
     */
    #getInstPath(): string {
        const stack = new Error().stack as string;
        const frame = stack.split('\n')[3].trim().replace(/\\/g, '/');
        // Credits to discord@A7mooz#2962 for the regex
        const regex = /([A-Z]:)?((\/)([a-zA-Z0-9_ ]\.?)+)+\3/g;
        return (regex.exec(frame) as string[])[0];
    }

    #keys: any[] = [];
    [key: string]: any;
    #configPath: string;

    /**
     * @description Initializes the config
     */
    constructor(configPath: string) {
        if (!configPath || typeof configPath !== 'string') throw new Error('Invalid config path');
        this.#configPath = path.join(this.#getInstPath(), configPath);
        this.reload();
    }
    /**
     * @description Reloads the config file
     */
    reload() {
        const old = { ...this };
        const oldKeys = [...this.#keys];
        delete require.cache[require.resolve(this.#configPath)];
        try {
            const config = require(this.#configPath);
            for (const key of Object.keys(config)) {
                if (key === 'reload') {
                    Logger.warn(`Config key 'reload' is reserved`);
                    continue;
                }
                this[key] = config[key];
                this.#keys.push(key);
            }
            Logger.info(`Config reloaded`);
        } catch (err: any) {
            Logger.error(`Failed to reload config: ${err.message}`);
            for (const key of this.#keys) {
                delete this[key];
            }
            for (const key of oldKeys) {
                this[key] = old[key];
            }
        }
    }
}

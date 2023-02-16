const path = require('path');
const Logger = require('./logger');

/**
 * @class Config
 * @classdesc The Config class is used to store and retrieve configuration data
 */
module.exports = class Config {
    #configPath = null;

    /**
     * Returns the path from where the Handler was called
     * @return {string} path of the instance
     */
    #getInstPath() {
        const stack = new Error().stack;
        const frame = stack.split('\n')[3].trim().replace(/\\/g, '/');
        // Credits to discord@A7mooz#2962 for the regex
        const regex = /([A-Z]:)?((\/)([a-zA-Z0-9_ ]\.?)+)+\3/g;
        const path = regex.exec(frame)[0];
        return path;
    }

    #keys = [];

    /**
     * Reloads the config file
     * @return {void}
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
        } catch (err) {
            Logger.error(`Failed to reload config: ${err.message}`);
            for (const key of this.#keys) {
                delete this[key];
            }
            for (const key of oldKeys) {
                this[key] = old[key];
            }
        }
    }

    /**
     * Initializes the config
     * @constructor
     * @param {string} configPath The path of the config relative to from where the constructor is called
     * @return {void}
     */
    constructor(configPath) {
        if (!configPath || typeof configPath !== 'string') throw new Error('Invalid config path');
        this.#configPath = path.join(this.#getInstPath(), configPath);
        this.reload();
    }
};

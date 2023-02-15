const path = require('path');
const Logger = require('./logger');
const Server = require('./server');

/**
 * @class Config
 * @classdesc The Config class is used to store and retrieve configuration data
 */
module.exports = class Config {
    static called = false;
    static configPath = null;
    static config = null;

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

    /**
     * Reloads the config file
     * @return {object} Returns the config object
     */
    static reload() {
        const old = Config.config;
        try {
            delete require.cache[require.resolve(Config.configPath)];
            Config.config = require(Config.configPath);
            Logger.info('Loaded config');
            return Config.config;
        } catch (e) {
            Config.config = old;
            Logger.error('Failed to load config');
            return false;
        }
    }

    /**
     * Initializes the config
     * @constructor
     * @param {string} configPath The path of the config relative to from where the constructor is called
     * @return {object} Returns the config object
     */
    constructor(configPath) {
        if (!Config.called) {
            Config.called = true;
            if (!configPath || typeof configPath !== 'string') throw new Error('Invalid config path');
            Config.configPath = path.join(this.#getInstPath(), configPath);
            if (Server.app && Server.app.listen && typeof Server.app.listen === 'function') {
                Server.app.post('/Config/reload', (req, res) => {
                    const success = Config.reload();
                    res.sendStatus(success ? 200 : 500);
                });
                Logger.info('Config API initialized');
            };
            return Config.reload();
        } else throw new Error('Config is already initialized');
    }
};

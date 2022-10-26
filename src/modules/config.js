const express = require('express');
const axios = require('axios');

module.exports = class Config {
    #CONFIGSERVER = null;
    #APPLICATIONID = null;
    #NODEID = null;
    #CONFIGSERVERTOKEN = null;
    #state = 'loading';
    #lastConfigKeys = [];
    #lastPublicKeys = [];
    #lastEnvKeys = [];
    static App = null;
    static config = {};
    static public = {};
    static _env = {};
    /**
     * Loads the configuration from the config server
     * @private
     * @return {Promise<void>}
     */
    async #loadConfiguration() {
        const Logger = require('./logger');
        await Promise.all([
            axios.get(`${this.#CONFIGSERVER}/config/${this.#APPLICATIONID}`, {
                headers: { token: this.#CONFIGSERVERTOKEN },
            }),
            axios.get(`${this.#CONFIGSERVER}/public/${this.#APPLICATIONID}`, {
                headers: { token: this.#CONFIGSERVERTOKEN },
            }),
            axios.get(`${this.#CONFIGSERVER}/env/${this.#APPLICATIONID}`, {
                headers: { token: this.#CONFIGSERVERTOKEN },
            })])
            .then((res) => {
                if (!res[0]?.data ||
                    !res[1]?.data ||
                    !res[2]?.data) return Logger.warn(`No configuration found on server ${this.#CONFIGSERVER}`);
                for (const key in this.#lastConfigKeys) {
                    delete this[key]; delete Config.config[key];
                }
                for (const key in this.#lastPublicKeys) {
                    delete this.public[key]; delete Config.public[key];
                }
                for (const key in this.#lastEnvKeys) {
                    delete this._env[key]; delete Config._env[key];
                }
                for (const [key, value] of Object.entries(res[0].data)) {
                    this.#lastConfigKeys.push(key);
                    this[key] = value;
                    Config.config[key] = value;
                }
                for (const [key, value] of Object.entries(res[1].data)) {
                    this.#lastPublicKeys.push(key);
                    this.public[key] = value;
                    Config.public[key] = value;
                }
                for (const [key, value] of Object.entries(res[2].data)) {
                    this.#lastEnvKeys.push(key);
                    this._env[key] = value;
                    Config._env[key] = value;
                }
                this.#state = 'loaded';
            });
    }
    /**
     * Starts the config server for listening to refreshs
     * @return {void} Returns nothing
     */
    #startServer() {
        const Logger = require('./logger');
        if (this.#state != 'loaded') return;
        const app = express();
        app.post('/Config/reload', (req, res) => {
            this.#loadConfiguration().then(() => {
                res.sendStatus(200);
            });
        });
        app.listen(this.public.api[this.#NODEID], () => {
            Logger.infog(`Node: ${this.public.api[this.#NODEID]}`);
        });
        Config.App = app;
    }
    /**
     * Initializes the config server connection data
     * @param {string} server The config server url
     * @param {string} token The token to access the config server
     * @param {string} app The application id
     * @param {string} node The node id
     */
    constructor({ server, token, app, node }) {
        const Logger = require('./logger');
        this.#CONFIGSERVER = server;
        this.#CONFIGSERVERTOKEN = token;
        this.#APPLICATIONID = app;
        this.#NODEID = node;
        this.public = {};
        this._env = {};
        Logger.info(`Config module initialized`);
    }
    /**
     * Starts the config server and loads the configuration to make it staticly available
     */
    async load() {
        await this.#loadConfiguration();
        this.#startServer();
    }
};

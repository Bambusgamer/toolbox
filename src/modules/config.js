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
    static #ready = false;
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
        if (!this.#testConnection()) throw new Error('Config server connection failed');
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
     * Creates the main api route for and exposes it to attach other routes
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
        app.start = () => {
            app.listen(this.public.api[this.#NODEID], () => {
                Logger.infog(`\nAPI port: ${this.public.api[this.#NODEID]}`);
            });
        };
        Config.App = app;
    }
    /**
     * Tests if a connection to the config server can be established
     * Doesn't return a promise
     * @return {boolean} Returns true if the connection was successful
     */
    #testConnection() {
        const Logger = require('./logger');
        return axios.get(`${this.#CONFIGSERVER}/test`, {
            headers: { token: this.#CONFIGSERVERTOKEN },
        }).then((res) => {
            if (res.data == 'OK') {
                return true;
            }
            Logger.warn('Connection to config server failed');
            return false;
        }).catch(() => {
            Logger.warn('Connection to config server failed');
            return false;
        });
    }
    /**
     * Initializes the config server connection data
     * @param {string} server The config server url
     * @param {string} token The token to access the config server
     * @param {string} app The application id
     * @param {string} node The node id
     */
    constructor(server, token, app, node) {
        const Logger = require('./logger');
        if (!server || !token || !app || !node) throw new Error('Invalid config server data');
        this.#CONFIGSERVER = server;
        this.#CONFIGSERVERTOKEN = token;
        this.#APPLICATIONID = app;
        this.#NODEID = node;
        this.public = {};
        this._env = {};
        Config.#ready = this.#testConnection();
        Logger.info(`Config module initialized`);
    }
    /**
     * Starts the config server and loads the configuration to make it staticly available
     */
    async load() {
        if (!Config.#ready) throw new Error('Config module not ready');
        await this.#loadConfiguration();
        this.#startServer();
    }
};

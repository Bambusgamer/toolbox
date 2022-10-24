const express = require('express'),
    axios = require('axios'),
    Logger = require('./logger');

module.exports.default, module.exports = class Config {
    #CONFIGSERVER = null;
    #APPLICATIONID = null;
    #NODEID = null;
    #CONFIGSERVERTOKEN = null;
    #state = 'loading';
    #lastConfigKeys = [];
    #lastPublicKeys = [];
    #lastEnvKeys = [];
    static config = {};
    static public = {};
    static _env = {};
    async #loadConfiguration() {
        await Promise.all([
            axios.get(`${this.#CONFIGSERVER}/config/${this.#APPLICATIONID}`, {
                headers: { token: this.#CONFIGSERVERTOKEN }
            }),
            axios.get(`${this.#CONFIGSERVER}/public/${this.#APPLICATIONID}`, {
                headers: { token: this.#CONFIGSERVERTOKEN }
            }),
            axios.get(`${this.#CONFIGSERVER}/env/${this.#APPLICATIONID}`, {
                headers: { token: this.#CONFIGSERVERTOKEN }
            })]).then(res => {
                if (!res[0]?.data || !res[1]?.data || !res[2]?.data) return Logger.warn(`No configuration found on server ${this.#CONFIGSERVER}`);
                for (const key in this.#lastConfigKeys) { delete this[key]; delete Config.config[key]; }
                for (const key in this.#lastPublicKeys) { delete this.public[key]; delete Config.public[key]; }
                for (const key in this.#lastEnvKeys) { delete this._env[key]; delete Config._env[key]; }
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
            })
    }
    #startServer() {
        if (this.#state !== 'loaded') return;
        const app = express();
        app.post('/refresh', (req, res) => {
            this.loadConfiguration().then(() => {
                res.sendStatus(200)
            });
        });
        app.listen(this.public.api[this.#NODEID], () => {
            console.log(`Node: ${this.public.api[this.#NODEID]}`);
        });
    }
    constructor(serverIp, serverToken, appId, nodeId) {
        this.#CONFIGSERVER = serverIp;
        this.#CONFIGSERVERTOKEN = serverToken;
        this.#APPLICATIONID = appId;
        this.#NODEID = nodeId
        this.public = {};
        this._env = {};
    }
    async load() {
        await this.#loadConfiguration();
        this.#startServer();
    }
}
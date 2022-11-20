const mongoose = require('mongoose');
const Logger = require('./logger');
const Config = require('./config');
const wait = require('node:timers/promises').setTimeout;

module.exports = class Mongoose {
    static called = false;
    #uri = null;
    /**
     * @private
     */
    #start() {
        const connect = () => mongoose.connect(this.#uri, {
            useUnifiedTopology: true,
        }).catch((err) => Logger.fatal([err, '']));
        mongoose.connection.on('connected', () => Logger.info(`√ Connected to MongoDB!`));
        mongoose.connection.on('disconnected', async () => {
            Logger.warn(`██ Disconnected from MongoDB!`);
            await wait(5000);
            Logger.warn(`██ Attempting to reconnect to MongoDB...`);
            connect();
        });
        connect();
    }
    /**
     * Initializes the Mongoose module and errors if it has already been initialized
     * Requires the Config module to be initialized first with a database config present
     * @constructor
     * @param {string} uri The uri to the database (optional if Config was initialized)
     */
    constructor(uri) {
        if (!Mongoose.called) {
            Mongoose.called = true;
            this.#uri = uri;
            if (!this.#uri && !Config?._env?.toolbox?.database) throw new Error('No database config present');
            if (!this.#uri) this.#uri = Config._env.toolbox.database;
            this.#start();
        } else throw new Error('Mongoose can only be called once');
    }
};

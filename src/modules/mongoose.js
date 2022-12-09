const mongoose = require('mongoose');
const Logger = require('./logger');
const { setTimeout } = require('node:timers/promises');

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
            await setTimeout(5000);
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
            if (!uri || typeof uri !== 'string') throw new Error('No database config present');
            this.#uri = uri;
            Mongoose.called = true;
            this.#start();
        } else throw new Error('Mongoose can only be called once');
    }
};

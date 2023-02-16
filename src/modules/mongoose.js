const mongoose = require('mongoose');
const Logger = require('./logger');
const { setTimeout } = require('node:timers/promises');

module.exports = class Mongoose {
    /**
     * Initializes the Mongoose module and errors if it has already been initialized
     * Requires the Config module to be initialized first with a database config present
     * @param {string} uri The uri to the database (optional if Config was initialized)
     */
    static init(uri) {
        if (!uri || typeof uri !== 'string') throw new Error('No database config present');
        const connect = () => mongoose.connect(uri, {
            useUnifiedTopology: true,
        }).catch(Logger.error);

        mongoose.set('strictQuery', true);
        mongoose.connection.on('connected', () => Logger.info(`√ Connected to MongoDB!`));
        mongoose.connection.on('disconnected', async () => {
            Logger.warn(`██ Disconnected from MongoDB!`);
            await setTimeout(5000);
            Logger.warn(`██ Attempting to reconnect to MongoDB...`);
            connect();
        });
        connect();
    }
};

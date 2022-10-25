const mongoose = require('mongoose');
const Logger = require('./logger');
const Config = require('./config');

module.exports = class Mongoose {
    static called = false;
    /**
     * @private
     */
    #start() {
        if (!Config?._env?.toolbox?.database) throw new Error('No database config present');
        const connect = () => mongoose.connect(Config._env.toolbox.database, {
            useUnifiedTopology: true,
        }).catch((err) => Logger.fatal([`Mongoose connection error`, err]));
        mongoose.connection.on('connected', () => Logger.info(`√ Connected to MongoDB!`));
        mongoose.connection.on('disconnected', async () => {
            Logger.error(`██ Disconnected from MongoDB!`);
            await client.wait(5000);
            Logger.infoh(`██ Attempting to reconnect to MongoDB...`);
            connect();
        });
        connect();
    }
    /**
     * Initializes the Mongoose module and errors if it has already been initialized
     * Requires the Config module to be initialized first with a database config present
     * @constructor
     * @private
     */
    constructor() {
        if (!Mongoose.called) {
            Mongoose.called = true;
            this.#start();
        } else throw new Error('Mongoose can only be called once');
    }
};

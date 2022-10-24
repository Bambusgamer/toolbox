const mongoose = require('mongoose'),
    Logger = require('./logger'),
    Config = require('./config');

module.exports = class Mongoose {
    static called = false;
    #start() {
        if (!Config?._env?.toolbox?.database) throw new Error('No database config present');
        const connect = () => mongoose.connect(Config._env.toolbox.database, {
            useUnifiedTopology: true,
        }).catch(err => Logger.fatal([`Mongoose connection error`, err]));
        mongoose.connection.on("connected", () => Logger.info(`√ Connected to MongoDB!`));
        mongoose.connection.on("disconnected", async () => {
            Logger.warn(`██ Disconnected from MongoDB!`);
            await client.wait(5000);
            Logger.infoh(`██ Attempting to reconnect to MongoDB...`);
            connect();
        });
        connect();
    }
    constructor() {
        if (!Mongoose.called) {
            Mongoose.called = true;
            this.#start();
        } else throw new Error('Mongoose can only be called once');
    }
};
const Logger = require('./logger');

module.exports = class AntiCrash {
    static called = false;
    #start() {
        process.on("unhandledRejection", (reason, p) => Logger.fatal([reason, p]));
        process.on("uncaughtException", (err, origin) => Logger.fatal([err, origin]))
        process.on("uncaughtExceptionMonitor", (err, origin) => Logger.fatal([err, origin]));
        process.on("unhandledRejection", (reason, p) => console.log(reason, p));
        process.on("uncaughtException", (err, origin) => console.log(err, origin))
        process.on("uncaughtExceptionMonitor", (err, origin) => console.log(err, origin));
    }
    constructor() {
        if (!AntiCrash.called) {
            AntiCrash.called = true;
            this.#start();
        } else throw new Error('AntiCrash can only be called once');
    }
}
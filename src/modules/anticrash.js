const Logger = require('./logger');
module.exports = class AntiCrash {
    static called = false;
    /**
     * Starts the AntiCrash module
     * @private
     */
    #start() {
        process.on('unhandledRejection', (reason, p) => Logger.fatal([reason, p]));
        process.on('uncaughtException', (err, origin) => Logger.fatal([err, origin]));
        process.on('uncaughtExceptionMonitor', (err, origin) => Logger.fatal([err, origin]));
    }
    /**
     * Initializes the AntiCrash module and errors if it has already been initialized
     * @private
     */
    constructor() {
        if (!AntiCrash.called) {
            AntiCrash.called = true;
            this.#start();
            Logger.info(`AntiCrash module initialized`);
        } else throw new Error('AntiCrash can only be called once');
    }
};

const Logger = require('./logger');
module.exports = class AntiCrash {
    static called = false;
    /**
     * Starts the AntiCrash module
     * @private
     */
    #start() {
        process.on('unhandledRejection', Logger.error);
        process.on('uncaughtException', Logger.error);
        process.on('uncaughtExceptionMonitor', Logger.error);
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

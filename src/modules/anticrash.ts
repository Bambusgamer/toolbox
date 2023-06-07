import Logger from './logger';

export default class AntiCrash {
    static called: boolean = false;

    /**
     * Initializes the AntiCrash module and errors if it has already been initialized
     */
    static init() {
        if (!AntiCrash.called) {
            AntiCrash.called = true;
            process.on('unhandledRejection', Logger.error);
            process.on('uncaughtException', Logger.error);
            process.on('uncaughtExceptionMonitor', Logger.error);
            Logger.info(`AntiCrash module initialized`);
        } else throw new Error('AntiCrash can only be called once');
    }
}

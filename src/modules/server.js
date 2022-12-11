const express = require('express');
const Logger = require('./logger');

/**
 * @class Server
 * @classdesc The Server all modules will be attached to. Must be started with the start() method at the end of initialization
 */
module.exports = class Server {
    static app = null;
    static called = false;
    /**
     * Starts the servers listener on the provided port
     * @param {number} port The port to listen on
     */
    static start(port) {
        if (!Server.app) throw new Error('Server is not initialized yet');
        if (!Server.listen || typeof Server.listen !== 'function') throw new Error('No valid express app available');
        if (!port) throw new Error('No port provided');
        Server.app.listen(port, () => {
            Logger.infog(`API port: ${port}`);
        }, Logger.error);
    }
    /**
     * Initializes the server
     * @constructor
     * @return {Server.app} Returns the express app
     */
    constructor() {
        if (!Server.called) {
            Server.called = true;
            const app = express();
            Server.app = app;
            Logger.info('Server initialized');
            return app;
        } else throw new Error('Server is already initialized');
    }
};

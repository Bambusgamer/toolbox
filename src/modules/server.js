const express = require('express');

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
        const Logger = require('./logger');
        if (!port) throw new Error('No port provided');
        this.app.listen(port, () => {
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
            const app = express();
            app.start = this.start;
            this.app = app;
            Server.called = true;
            return app;
        } else throw new Error('Server is already initialized');
    }
};

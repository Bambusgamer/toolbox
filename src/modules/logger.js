const { Console } = require('console');
const moment = require('moment');
const chalk = require('chalk');
const axios = require('axios');
const fs = require('fs');
const _path = require('path');

const timestamp = () => ({ text: moment().format('YYYY-MM-DD HH:mm:ss'), unix: moment().unix() });
const stringify = (obj) => typeof obj == 'object' ? JSON.stringify(obj, 10, 2) : obj;
const trace = () => new Error().stack.split('\n').slice(4).join('\n').trim();
const colors = {
    white: chalk.white,
    blue: chalk.blue,
    yellow: chalk.yellow,
    green: chalk.green,
    red: chalk.red,
    orange: chalk.hex('#FFA500'),
};

module.exports = class Logger {
    // Static fields
    static called = false;
    static path = null;
    static server = null;
    static token = null;
    static appid = null;
    static filestream = null;
    /**
     * Returns the path from where the Handler was called
     * @return {string} path of the instance
     */
    #getInstPath() {
        const stack = new Error().stack;
        const frame = stack.split('\n')[3].trim();
        const path = frame.match(/\((.*):[0-9]+:[0-9]+\)/)[1].split('\\').slice(0, -1).join('\\');
        return path;
    }
    /**
     * Logs content to the console
     * @param {*} data Array of Promises or string to log
     * @param {string} level The level of the log [LOG, INFO, INFOH, INFOT, WARN, ERROR, FATAL] (default: LOG) wich will be used to color the output
     */
    static console(data, level) {
        const Config = require('./config');
        switch (level) {
            case 'INFOY':
                console.log(colors.yellow(`${stringify(data)}${Config._env?.toolbox?.trace ? `\n${trace()}` : ''}`));
                break;
            case 'INFOG':
                console.log(colors.green(`[${timestamp().text}] | ${stringify(data)}${Config._env?.toolbox?.trace ? `\n${trace()}` : ''}`));
                break;
            case 'INFO':
                console.log(colors.blue(`[${timestamp().text}] | ${stringify(data)}${Config._env?.toolbox?.trace ? `\n${trace()}` : ''}`));
                break;
            case 'WARN':
                console.log(colors.orange(`[${timestamp().text}] | ${stringify(data)}${Config._env?.toolbox?.trace ? `\n${trace()}` : ''}`));
                break;
            case 'ERROR':
                console.log(colors.red(`[${timestamp().text}] | ${stringify(data)}${Config._env.toolbox?.trace ? `\n${trace()}` : ''}`));
                break;
            case 'FATAL':
                console.log(colors.red(`[${timestamp().text}] |`), data[0], data[1] || '');
                break;
            default:
                console.log(colors.white(`[${timestamp().text}] | ${stringify(data)}${Config._env?.toolbox?.trace ? `\n${trace()}` : ''}`));
                break;
        }
    }
    /**
     * Logs content to a log file if a path was provided
     * @param {*} data Array of Promises or string to log
     * @param {string} level The level of the log [LOG, INFO, INFOH, INFOT, WARN, ERROR, FATAL] (default: LOG) wich will be used to label the output
     */
    static write(data, level) {
        const Config = require('./config');
        if (Logger.filestream) Logger.filestream.log(...[`[${timestamp().text}] |`, ...(level != 'FATAL' ? [data] : [data[0], data[1]]), !Config._env?.toolbox?.trace && level != 'FATAL' ? '' : `\n${trace()}`].map((obj) => typeof obj == 'string' ? obj.replace(/^\n+|\n+$/g, '') : obj));
    }
    /**
     * Logs content to a log server if a server was provided
     * @param {*} data Array of Promises or string to log
     * @param {*} level The level of the log [LOG, INFO, INFOH, INFOT, WARN, ERROR, FATAL] (default: LOG) wich will be used to label the output
     */
    static send(data, level) {
        if (Logger.logserver && Logger.logservertoken && Logger.appid) {
            axios.post(Logger.logserver, {
                token: Logger.logservertoken,
                appid: Logger.appid,
                data: JSON.stringify(data),
                level,
            }).catch((err) => {
                if (err.code == 'ETIMEDOUT') return (this.console(`Server is not reachable.path: ${Logger.logserver} `, 'ERROR') && this.write(`Server is not reachable.path: ${Logger.logserver} `, 'ERROR'));
                if (err.response.status === 401) return (this.console(`Logging server is not authorized`, 'ERROR') && this.write(`Logging server is not authorized`, 'ERROR'));
            });
        }
    }
    /**
     * Logs content to the console and optionally if a path was provided to a log file and if a server was provided to a log server as an default log
     * white
     * @param {string} data String to log
     */
    static log(data) {
        this.console(data, 'LOG');
        this.write(data, 'LOG');
        this.send(data, 'LOG');
    }
    /**
     * Logs content to the console and optionally if a path was provided to a log file and if a server was provided to a log server as an info
     * blue
     * @param {string} data String to log
     */
    static info(data) {
        this.console(data, 'INFO');
        this.write(data, 'INFO');
        this.send(data, 'INFO');
    }
    /**
     * Logs content to the console and optionally if a path was provided to a log file and if a server was provided to a log server as an info
     * yellow
     * @param {string} data String to log
     */
    static infoy(data) {
        this.console(data, 'INFOY');
        this.write(data, 'INFOY');
        this.send(data, 'INFOY');
    }
    /**
     * Logs content to the console and optionally if a path was provided to a log file and if a server was provided to a log server as an info
     * green
     * @param {string} data String to log
     */
    static infog(data) {
        this.console(data, 'INFOG');
        this.write(data, 'INFOG');
        this.send(data, 'INFOG');
    }
    /**
     * Logs content to the console and optionally if a path was provided to a log file and if a server was provided to a log server as a warning
     * orange
     * @param {string} data String to log
     */
    static warn(data) {
        this.console(data, 'WARN');
        this.write(data, 'WARN');
        this.send(data, 'WARN');
    }
    /**
     * Logs content to the console and optionally if a path was provided to a log file and if a server was provided to a log server as a error
     * red
     * @param {string} data String to log
    */
    static error(data) {
        this.console(data, 'ERROR');
        this.write(data, 'ERROR');
        this.send(data, 'ERROR');
    }
    /**
     * Logs content of the AntiCrash module to the console and optionally if a path was provided to a log file and if a server was provided to a log server as a fatal
     * red
     * @param {array} data Array of Promises to log
     */
    static fatal(data) {
        this.console(data, 'FATAL');
        this.write(data, 'FATAL');
        this.send(data, 'FATAL');
    }
    /**
     * Initializes the logger
     * @constructor
     * @param {Object} options The options for the logger (_env.toolbox)
     * @param {string} options.logpath The path to the log file relative to from where the constructor is called
     * @param {string} options.logserver The url to the log server
     * @param {string} options.logservertoken The token for the log server
     * @param {string} options.appid The appid for the log server
     */
    constructor(options) {
        const { logpath, logserver, logservertoken, appid } = options;
        if (!Logger.called) {
            Logger.called = true;
            Logger.path = logpath ? _path.join(this.#getInstPath(), logpath) : null;
            Logger.filestream = Logger.path ? new Console({ stdout: fs.createWriteStream(Logger.path, { flags: 'a+' }), stderr: fs.createWriteStream(Logger.path, { flags: 'a+' }) }) : null;
            Logger.logserver = logserver;
            Logger.logservertoken = logservertoken;
            Logger.appid = appid;
            Logger.info(`Logger module initialized`);
        } else throw new Error('Logger is already initialized');
    }
};

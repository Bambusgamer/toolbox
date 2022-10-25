const { Console } = require('console');
const moment = require('moment');
const chalk = require('chalk');
const axios = require('axios');
const fs = require('fs');
const _path = require('path');
const toolbox = require('../');

const timestamp = () => ({ text: moment().format('YYYY-MM-DD HH:mm:ss'), unix: moment().unix() });
const stringify = (obj) => typeof obj == 'object' ? JSON.stringify(obj, 10, 2) : obj;
const trace = () => new Error().stack.split('\n').slice(4).join('\n').trim();

module.exports = class Logger {
    static called = false;
    static path = null;
    static server = null;
    static token = null;
    static appid = null;
    static filestream = null;
    /**
     * Returns the path from where the logger was called
     * @return {string} path of the instance
     */
    #getInstPath() {
        const stack = new Error().stack;
        const frame = stack.split('\n')[3];
        return _path.dirname(frame.split('at ')[1].split(':')[0].replace(__dirname, ''));
    }
    /**
     * Logs content to the console
     * @param {*} data Array of Promises or string to log
     * @param {string} level The level of the log [LOG, INFO, INFOH, INFOT, WARN, ERROR, FATAL] (default: LOG) wich will be used to color the output
     */
    static console(data, level) {
        switch (level) {
            case 'INFOH':
                console.log(chalk.yellow(`${stringify(data)}${toolbox.Config._env?.toolbox?.trace ? `\n${trace()}` : ''}`));
                break;
            case 'INFOT':
                console.log(chalk.green(`[${timestamp().text}] | ${stringify(data)}${toolbox.Config._env?.toolbox?.trace ? `\n${trace()}` : ''}`));
                break;
            case 'INFO':
                console.log(chalk.blue(`[${timestamp().text}] | ${stringify(data)}${toolbox.Config._env?.toolbox?.trace ? `\n${trace()}` : ''}`));
                break;
            case 'ERROR':
                console.log(chalk.red(`[${timestamp().text}] | ${stringify(data)}${toolbox.Config._env.toolbox?.trace ? `\n${trace()}` : ''}`));
                break;
            case 'FATAL':
                console.log(chalk.redBright(`[${timestamp().text}] |`), data[0], data[1]);
                break;
            default:
                console.log(chalk.white(`[${timestamp().text}] | ${stringify(data)}${toolbox.Config._env?.toolbox?.trace ? `\n${trace()}` : ''}`));
                break;
        }
    }
    /**
     * Logs content to a log file if a path was provided
     * @param {*} data Array of Promises or string to log
     * @param {string} level The level of the log [LOG, INFO, INFOH, INFOT, WARN, ERROR, FATAL] (default: LOG) wich will be used to label the output
     */
    static write(data, level) {
        if (Logger.filestream) Logger.filestream.log(`[${timestamp().text}] |`, ...(level != 'FATAL' ? [data] : [data[0], data[1]]), toolbox.Config._env?.toolbox?.trace && level != 'FATAL' ? '' : `\n${trace()}`);
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
     * Logs content to the console and optionally if a path was provided to a log file and if a server was provided to a log server as an default log (white)
     * @param {string} data String to log
     */
    static log(data) {
        this.console(data, 'LOG');
        this.write(data, 'LOG');
        this.send(data, 'LOG');
    }
    /**
     * Logs content to the console and optionally if a path was provided to a log file and if a server was provided to a log server as an info (blue)
     * @param {string} data String to log
     */
    static info(data) {
        this.console(data, 'INFO');
        this.write(data, 'INFO');
        this.send(data, 'INFO');
    }
    /**
     * Logs content to the console and optionally if a path was provided to a log file and if a server was provided to a log server as an info (yellow)
     * @param {string} data String to log
     */
    static infoh(data) {
        this.console(data, 'INFOH');
        this.write(data, 'INFOH');
        this.send(data, 'INFOH');
    }
    /**
     * Logs content to the console and optionally if a path was provided to a log file and if a server was provided to a log server as an info (green)
     * @param {string} data String to log
     */
    static infot(data) {
        this.console(data, 'INFOT');
        this.write(data, 'INFOT');
        this.send(data, 'INFOT');
    }
    /**
     * Logs content to the console and optionally if a path was provided to a log file and if a server was provided to a log server as a error (red)
     * @param {string} data String to log
    */
    static error(data) {
        this.console(data, 'ERROR');
        this.write(data, 'ERROR');
        this.send(data, 'ERROR');
    }
    /**
     * Logs content of the AntiCrash module to the console and optionally if a path was provided to a log file and if a server was provided to a log server as a fatal (red)
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
     * @param {Object} param0 The options for the logger (_env.toolbox)
     * @param {string} param0.logpath The path to the log file relative to from where the constructor is called
     * @param {string} param0.logserver The url to the log server
     * @param {string} param0.logservertoken The token for the log server
     * @param {string} param0.appid The appid for the log server
     */
    constructor({ logpath, logserver, logservertoken, appid }) {
        if (!Logger.called) {
            Logger.called = true;
            Logger.path = logpath ? _path.join(this.#getInstPath(), logpath) : null;
            Logger.filestream = Logger.path ? new Console({ stdout: fs.createWriteStream(Logger.path, { flags: 'a+' }), stderr: fs.createWriteStream(Logger.path, { flags: 'a+' }) }) : null;
            Logger.logserver = logserver;
            Logger.logservertoken = logservertoken;
            Logger.appid = appid;
        } else throw new Error('Logger is already initialized');
    }
};

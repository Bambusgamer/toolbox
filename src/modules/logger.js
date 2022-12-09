const { Console } = require('console');
const moment = require('moment');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

const timestamp = () => `[${moment().format('YYYY-MM-DD HH:mm:ss')}] | `;
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
    static logPath = null;
    static fileStream = null;
    /**
     * Returns the path from where the Handler was called
     * @return {string} path of the instance
     */
    #getInstPath() {
        const stack = new Error().stack;
        const frame = stack.split('\n')[3].trim();
        // Credits to discord@A7mooz#2962 for the regex
        const regex = /([A-Z]:)?((\/|\\)(\w\.?)+)+\3/g;
        const instancePath = regex.exec(frame)[0].replace(/\\/g, '/');
        return instancePath;
    }
    /**
     * Logs content to the console
     * @param {*} data Array of Promises or string to log
     * @param {string} level The level of the log [LOG, INFO, INFOH, INFOT, WARN, ERROR, FATAL] (default: LOG) wich will be used to color the output
     */
    static console(data, level) {
        const Config = require('./config.js');
        const output = Config._env?.toolbox?.trace ? [...data, trace()] : data;
        switch (level) {
            // infoy
            case 1:
                console.log(colors.yellow(timestamp()), ...output);
                break;
            // infog
            case 2:
                console.log(colors.green(timestamp()), ...output);
                break;
            // infob
            case 3:
                console.log(colors.blue(timestamp()), ...output);
                break;
            // warn
            case 4:
                console.log(colors.orange(timestamp()), ...output);
                break;
            // error
            case 5:
                console.log(colors.red(timestamp()), ...output);
                break;
            // newline
            case 6:
                console.log('');
                break;
            default:
                console.log(colors.white(timestamp()), ...output);
                break;
        }
    }
    /**
     * Logs content to a log file if a path was provided
     * @param {*} data Array of Promises or string to log
     */
    static write(data) {
        const Config = require('./config');
        const output = Config._env?.toolbox?.trace ? [...data, trace()] : data;
        if (Logger.fileStream) Logger.fileStream.log(timestamp(), ...output);
    }
    /**
     * Logs content to the console and optionally if a path was provided to a log file and if a server was provided to a log server as an info
     * yellow
     * @param {string} data String to log
     */
    static infoy(data) {
        this.console(data, 1);
        this.write(data);
    }
    /**
     * Logs content to the console and optionally if a path was provided to a log file and if a server was provided to a log server as an info
     * green
     * @param {string} data String to log
     */
    static infog(data) {
        this.console(data, 2);
        this.write(data);
    }
    /**
     * Logs content to the console and optionally if a path was provided to a log file and if a server was provided to a log server as an info
     * blue
     * @param {string} data String to log
     */
    static info(data) {
        this.console(data, 3);
        this.write(data);
    }
    /**
     * Logs content to the console and optionally if a path was provided to a log file and if a server was provided to a log server as a warning
     * orange
     * @param {string} data String to log
     */
    static warn(data) {
        this.console(data, 4);
        this.write(data);
    }
    /**
     * Logs content to the console and optionally if a path was provided to a log file and if a server was provided to a log server as a error
     * red
     * @param {string} data String to log
    */
    static error(data) {
        this.console(data, 5);
        this.write(data);
    }
    /**
     * Logs content to the console and optionally if a path was provided to a log file and if a server was provided to a log server as an default log
     * white
     * @param {string} data String to log
     */
    static log(data) {
        this.console(data, null);
        this.write(data);
    }
    /**
     * Logs out a new line or multiple new lines
     * @param {number} lines Number of new lines to log out
     */
    static newline(lines) {
        for (let i = 0; i < (lines ?? 1); i++) {
            this.console('', 6);
        }
    }
    /**
     * Initializes the logger
     * @constructor
     * @param {string} logpath The path to the log file relative to from where the constructor is called
     */
    constructor(logpath) {
        if (!Logger.called) {
            Logger.called = true;
            if (logpath && !typeof logpath === 'string') throw new Error('logpath must be a string');
            Logger.logPath = logpath ? path.join(this.#getInstPath(), logpath) : null;
            Logger.fileStream = Logger.logPath ? new Console({ stdout: fs.createWriteStream(Logger.logPath, { flags: 'a+' }), stderr: fs.createWriteStream(Logger.logPath, { flags: 'a+' }) }) : null;
            Logger.info(`Logger module initialized`);
        } else throw new Error('Logger is already initialized');
    }
};

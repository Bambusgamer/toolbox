const { Console } = require('console');
const moment = require('moment'),
    chalk = require('chalk'),
    axios = require('axios'),
    fs = require('fs'),
    _path = require('path'),
    toolbox = require('../');

const timestamp = () => ({ text: moment().format('YYYY-MM-DD HH:mm:ss'), unix: moment().unix() });
const stringify = (obj) => typeof obj == 'object' ? JSON.stringify(obj, 10, 2) : obj;
const trace = () => new Error().stack.split('\n').slice(3).join('\n').trim();

module.exports = class Logger {
    static called = false;
    static path = null;
    static server = null;
    static token = null;
    static appid = null;
    static filestream = null;
    #getInstPath() {
        const stack = new Error().stack;
        const frame = stack.split('\n')[3];
        return _path.dirname(frame.split('at ')[1].split(':')[0].replace(__dirname, ''))
    }
    static console(data, level) {
        switch (level) {
            case 'INFOH':
                console.log(chalk.yellow(`${stringify(data)}${toolbox.Config._env?.toolbox?.trace ? `\n${trace()}` : ''}`));
                break;
            case 'INFOT':
                console.log(chalk.green(`[${timestamp().text}] | ${stringify(data)}${toolbox.Config._env?.toolbox?.trace ? `\n${trace()}` : ''}`));
            case 'INFO':
                console.log(chalk.blue(`${stringify(data)}${toolbox.Config._env?.toolbox?.trace ? `\n${trace()}` : ''}`));
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
    static write(data, level) {
        if (Logger.filestream) Logger.filestream.log(`[${timestamp().text}] |`, ...(level != 'FATAL' ? [data] : [data[0], data[1]]), toolbox.Config._env?.toolbox?.trace && level != 'FATAL' ? '' : `\n${trace()}`);
    }
    static send(data, level) {
        if (Logger.logserver && Logger.logservertoken && Logger.appid) {
            axios.post(Logger.logserver, {
                token: Logger.logservertoken,
                appid: Logger.appid,
                data: JSON.stringify(data),
                level
            }).catch(err => {
                if (err.code == 'ETIMEDOUT') return (this.console(`Server is not reachable.path: ${Logger.logserver} `, 'ERROR') && this.write(`Server is not reachable.path: ${Logger.logserver} `, 'ERROR'));
                if (err.response.status === 401) return (this.console(`Logging server is not authorized`, 'ERROR') && this.write(`Logging server is not authorized`, 'ERROR'));
            })
        }
    }
    static log(data) {
        this.console(data, 'LOG');
        this.write(data, 'LOG');
        this.send(data, 'LOG');
    }
    static info(data) {
        this.console(data, 'INFO');
        this.write(data, 'INFO');
        this.send(data, 'INFO');
    }
    static infoh(data) {
        this.console(data, 'INFOH');
        this.write(data, 'INFOH');
        this.send(data, 'INFOH');
    }
    static infot(data) {
        this.console(data, 'INFOT');
        this.write(data, 'INFOT');
        this.send(data, 'INFOT');
    }
    static warn(data) {
        this.console(data, 'ERROR');
        this.write(data, 'ERROR');
        this.send(data, 'ERROR');
    }
    static error(data) {
        this.console(data, 'ERROR');
        this.write(data, 'ERROR');
        this.send(data, 'ERROR');
    }
    static fatal(data) {
        console.log(toolbox.Config._env.toolbox.trace)
        this.console(data, 'FATAL');
        this.write(data, 'FATAL');
        this.send(data, 'FATAL');
    }
    constructor({ logpath, logserver, logservertoken, appid }) {
        if (!Logger.called) {
            Logger.called = true;
            Logger.path = logpath ? _path.join(this.#getInstPath(), logpath) : null;
            Logger.filestream = new Console({ stdout: fs.createWriteStream(Logger.path, { flags: 'a+' }), stderr: fs.createWriteStream(Logger.path, { flags: 'a+' }) });
            Logger.logserver = logserver;
            Logger.logservertoken = logservertoken;
            Logger.appid = appid;
        } else throw new Error('Logger is already initialized');
    }
}
import { Console } from 'console';
import moment from 'moment';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

function generateTimestamp() {
    return `[${moment().format('YYYY-MM-DD HH:mm:ss')}] | `;
}
function generateTrace() {
    return (new Error().stack as string).split('\n').slice(4).join('\n').trim();
}
const colors = {
    white: chalk.white,
    blue: chalk.blue,
    yellow: chalk.yellow,
    green: chalk.green,
    red: chalk.red,
    orange: chalk.hex('#FFA500'),
};

enum Colors {
    white = 'white',
    blue = 'blue',
    yellow = 'yellow',
    green = 'green',
    red = 'red',
    orange = 'orange',
}

/**
 * @description Returns the path from where the Handler was called
 */
function getInstPath(): string {
    const stack = new Error().stack as string;
    const frame = stack.split('\n')[3].trim().replace(/\\/g, '/');
    // Credits to discord@A7mooz#2962 for the regex
    const regex = /([A-Z]:)?((\/)([a-zA-Z0-9_ ]\.?)+)+\3/g;
    return (regex.exec(frame) as string[])[0];
}

export default class Logger {
    // Static fields
    static called = false;
    static logPath: string | null = null;
    static fileStream: Console | null = null;

    /**
     * @description Logs content to the console
     */
    static console(data: any[], color: Colors = Colors.white, timestamp: boolean = true) {
        let trace = false;
        if (Logger.called) {
            const { config } = require('./config');
            trace = config?.toolbox?.trace ?? false;
        }

        if (timestamp) {
            data.unshift(colors[color](generateTimestamp()));
        }

        if (trace) {
            data.push(generateTrace());
        }

        console.log(...data);
    }

    static write(data: any[]) {
        if (Logger.fileStream) Logger.fileStream.log(generateTimestamp(), ...data);
    }

    static infoy(...data: any[]) {
        Logger.console(data, Colors.yellow);
        Logger.write(data);
    }

    static infog(...data: any[]) {
        Logger.console(data, Colors.green);
        Logger.write(data);
    }

    static info(...data: any[]) {
        Logger.console(data);
        Logger.write(data);
    }

    static warn(...data: any[]) {
        Logger.console(data, Colors.orange);
        Logger.write(data);
    }

    static error(...data: any[]) {
        Logger.console(data, Colors.red);
        Logger.write(data);
    }

    static log(...data: any[]) {
        Logger.console(data, Colors.white);
        Logger.write(data);
    }

    static newline(lines: number = 1) {
        for (let i = 0; i < lines; i++) {
            Logger.console([''], Colors.white, false);
        }
    }

    static init(logpath: string) {
        if (!Logger.called) {
            Logger.called = true;
            if (logpath && typeof logpath !== 'string') throw new Error('logpath must be a string');
            Logger.logPath = logpath ? path.join(getInstPath(), logpath) : null;
            Logger.fileStream = Logger.logPath
                ? new Console({
                    stdout: fs.createWriteStream(Logger.logPath, { flags: 'a+' }),
                    stderr: fs.createWriteStream(Logger.logPath, { flags: 'a+' }),
                })
                : null;
            Logger.info(`Logger module initialized`);
        } else throw new Error('Logger is already initialized');
    }
}

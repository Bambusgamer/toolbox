import mongoose from 'mongoose';
import Logger from './logger';
import { setTimeout } from 'timers/promises';

export default class Mongoose {
    static init(uri: string, options?: mongoose.ConnectOptions) {
        if (!uri || typeof uri !== 'string') throw new Error('No database config present');
        const connect = () => mongoose.connect(uri, options).catch(Logger.error);

        mongoose.set('strictQuery', true);
        mongoose.connection.on('connected', () => Logger.info(`√ Connected to MongoDB!`));
        mongoose.connection.on('disconnected', async () => {
            Logger.warn(`██ Disconnected from MongoDB!`);
            await setTimeout(5000);
            Logger.warn(`██ Attempting to reconnect to MongoDB...`);
            connect();
        });
        connect();
    }
}

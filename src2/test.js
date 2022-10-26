/* eslint-disable no-unused-vars */
const Logger = require('../src/modules/logger');
const Config = require('../src/modules/config');
const Handler = require('../src/modules/handler');

// new Config({ server: 'http://192.168.178.170:3501', token: '?wkmp@Mm2&RbcM$', app: 'app5', node: 'main' }).load()
//     .then(() => {
new Logger({ logpath: './log.log' });
Logger.infoy('Started');

const handler = new Handler({}, {
    commands: './commands',
});

handler.load();

// Logger.log(handler.commands);
// handler.clear();
// Logger.log(handler.commands);
// });

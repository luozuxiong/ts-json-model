const chalk = require('chalk');
const log = console.log;

const print = (message, chalkHandler) => log(chalkHandler(message));

exports.error = message => print(message, chalk.red);

exports.info = message => print(message,chalk.green);

exports.warn = message => print(message,chalk.yellow);
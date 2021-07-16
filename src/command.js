#! /usr/bin/env node

const pkg = require('./../package.json');
const {Command} = require('commander');
const command = new Command();

const {init,Work} = require("./core/actions")

command
    .version(pkg.version, '-v,--version')
    .action(args => {
        const worker = new Work();
        worker.starting();
    });

command.command('init')
    .action(init)

command.parse(process.argv);


module.exports = command;
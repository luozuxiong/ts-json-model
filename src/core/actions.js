const fs = require('fs-extra');
const logger = require('./../log');
const fsLib = require('fs');
const pathLib = require('path');
const {readSync} = require('readdir')

const {configFileName} = require("./../constants");

const defaultConfig = require('./../template/j2m.config.json');

const init = () => {
    fs.createFile(configFileName);
}

class Work {

    sources = []

    root = pathLib.resolve('.')

    constructor() {
        fs.readJson(configFileName, (err, res) => {
            if (err) {
                logger.warn(`The configFile not found:${configFileName}"`)
                this.options = defaultConfig;
            } else {
                this.options = res;
            }
            this.getJsonFiles();
            this.parseContent()
        });

    }

    getJsonFiles() {
        const srcDir = this.options.src;
        if (Array.isArray(srcDir)) {
            srcDir.forEach(path => this.loopSrcPathSync(path));
        } else {
            this.loopSrcPathSync(srcDir);
        }

    }

    loopSrcPathSync(path) {
        //path is not exists
        if (!fs.pathExistsSync(path)) {
            return;
        }
        const folder = pathLib.resolve(path);
        const files = readSync(folder)

        this.sources = files.map(file => {
            return {
                file: pathLib.resolve(folder, file)
            }
        });

        console.log(this.sources)

    }

    parseContent() {
        const fileParsePromise = this.sources.map(source => fs.readJson(source.file));
        Promise.all(fileParsePromise).then(records => {
            console.log(records)
        })
    }

    starting() {
    }
}

module.exports = {
    init,
    Work
}
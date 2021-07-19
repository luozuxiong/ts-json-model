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
                resolvePosition: file,
                file: pathLib.resolve(folder, file)
            }
        });


    }

    parseContent() {
        const fileParsePromise = this.sources.map(source => new Promise((resolve, reject) => {
            fs.readJson(source.file, (err, content) => {
                if (err) {
                    logger.error(`read json file error:${err}`);
                    return reject({
                        file: source.file,
                        err
                    });
                }
                const target = this.getTargetTSFile(source, content)
                resolve({
                    file: source.file,
                    json: content,
                    ...target
                })
            })
        }));
        Promise.all(fileParsePromise)
            .then(records => {
                return records;
            }).then(this.writingTargetFile.bind(this))
            .catch(error => {
                logger.error(error);
            })
    }

    getTargetTSFile(file, json) {
        const outPut = pathLib.resolve(this.root, this.options.output);
        const targetFileName = pathLib.join(outPut, file.resolvePosition).replace(pathLib.extname(file.file), '.ts');
        const targetFileSimpleName = pathLib.basename(targetFileName,".ts");

        return {
            targetFileName,
            tsContent:this.getTargetTSFileContent(targetFileName,json)
        }
    }

    writingTargetFile(records) {
        const promiseCallers = records.map(record=>{

            return new Promise((resolve,reject)=>{
                fsLib.writeFile(record.targetFileName,record.tsContent,(err,result)=>{
                    if(err){
                        return reject(err);
                    }
                    resolve(result);
                })
            })
        })
        return Promise.all(promiseCallers)
    }
    getTargetTSFileContent(targetFileSrc,json){
        const fileSimpleName = pathLib.basename(targetFileSrc,".ts");
        let contentStr = `export default class ${fileSimpleName} {`;
        console.log(contentStr)
        contentStr += '\n}';
        return contentStr;
    }
    starting() {
    }
}

module.exports = {
    init,
    Work
}
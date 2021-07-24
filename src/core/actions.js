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

class Source {
    resolvePosition = ""
    file = ""
    shortName = ""
    tsContent = ' '
    status = 1
    json = ''

    constructor(file, folder, jsonContent) {
        this.resolvePosition = file;
        this.file = pathLib.resolve(folder, file);
        this.shortName = file.replace(".json", "");
        this.json = jsonContent;
    }
}

class Work {

    sources = []

    root = pathLib.resolve('.')

    startTimeSpan = 0

    constructor() {

        this.startTimeSpan = Date.now()

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

        const files = readSync(folder);

        this.sources = files.map(file => new Source(file, folder));

    }

    parseContent() {
        const fileParsePromise = this.getFileParsePromises();
        if (fileParsePromise.length === 0) {
            logger.info(`\nTask is Successfully executed in ${Date.now() - this.startTimeSpan}ms!`)
            return;
        }
        Promise
            .all(fileParsePromise)
            .then(records => {
                return records;
            })
            .then(this.writingTargetFile.bind(this))
            .then(() => this.parseContent())
            .catch(error => {
                logger.error(error);
            })
    }

    getFileParsePromises() {
        return this.sources.filter(source => source.status === 1).map(source => new Promise((resolve, reject) => {
            source.status = 2;
            if (source.json) {
                return resolve({
                    file: source.file,
                    json: source.json,
                    ...this.getTargetTSFile(source, source.json)
                });
            }
            fs.readJson(source.file, (err, content) => {
                if (err) {
                    logger.error(`read json file error:${err}`);
                    return reject({
                        file: source.file,
                        err
                    });
                }
                resolve({
                    file: source.file,
                    json: content,
                    ...this.getTargetTSFile(source, content)
                })
            })
        }));
    }

    getTargetTSFile(file, json) {
        const outPut = pathLib.resolve(this.root, this.options.output);
        const targetFileName = pathLib.join(outPut, file.resolvePosition).replace(pathLib.extname(file.file), '.ts');
        const targetInfo = this.getTargetTSFileContent(targetFileName, json);
        return {
            targetFileName,
            ...targetInfo
        }
    }

    writingTargetFile(records) {
        const promiseCallers = records.map(record => {
            return new Promise((resolve, reject) => {
                fs.ensureFileSync(record.targetFileName);
                // 'flag a+' can't create folder
                fsLib.writeFile(record.targetFileName, record.tsContent, (err, result) => {
                    if (err) {
                        return reject(err);
                    }
                    logger.info(`The typescript model ${record.targetFileName} has been created!`)
                    resolve(result);
                })
            })
        })
        return Promise.all(promiseCallers)
    }

    getTargetTSFileContent(targetFileSrc, json) {
        const fileSimpleName = pathLib.basename(targetFileSrc, ".ts");
        let dependencies = [];
        let contentStr = `export default class ${fileSimpleName}`;
        let importStr = "";
        if (json.hasOwnProperty('_extend')) {
            this.addDependency(dependencies,json._extend)
            contentStr += ` extends ${pathLib.basename(json._extend)} `;
        }
        contentStr += `{`;
        for (let key in json) {
            if (json.hasOwnProperty(key) && !['_extend', '_name'].includes(key)) {
                const comment = this.getComments(json[key]);
                if (comment) {
                    contentStr += `\n\t // ${comment}`;
                }
                const typeStr = this.getValueType(json[key], dependencies);
                contentStr += `\n\t public ${key}: ${typeStr}`;
            }
        }
        // const
        dependencies.forEach(dependency => {
            let basename = pathLib.basename(dependency);
            basename = basename.charAt(0).toUpperCase() + basename.substring(1);
            importStr += `import ${basename} from "./${dependency}";\n`;
        })
        if (importStr) {
            contentStr = importStr + '\n' + contentStr;
        }
        contentStr += '\n}';
        return {
            tsContent: contentStr,
            dependencies
        };
    }

    getComments(jsonValue) {
        const matches = /#(.+)#/.exec(jsonValue);
        return matches !== null ? matches[1] : '';
    }

    getValueType(jsonValue, dependencies) {
        switch (typeof jsonValue) {
            case "number":
                return 'number';
            case "boolean":
                return "boolean";
            case "string":
                jsonValue = jsonValue.replace(/#(.+)#/, '');
                if (['number', 'boolean'].indexOf(jsonValue) > -1) {
                    return jsonValue;
                } else if (jsonValue.charAt(0) === '$') {
                    const dependency = jsonValue.substring(1);
                    this.addDependency(dependencies,dependency);
                    return dependency;
                }
                if (this.childIsArray(jsonValue)) {
                    const dependency = jsonValue.substring(1, jsonValue.length - 1);
                    this.addDependency(dependencies,dependency)
                    return `Array<${dependency}>`
                }
                return "string";
            case "object":
                if (Array.isArray(jsonValue)) {
                    if (jsonValue.length === 1 && jsonValue[0]._name) {
                        this.addNewClassFromChild(jsonValue[0], dependencies);
                        return `Array<${jsonValue[0]._name}>`;
                    }
                } else if (jsonValue._name) {
                    this.addNewClassFromChild(jsonValue, dependencies);
                    return `${jsonValue._name}`;
                }
                return '"UNKnown"';
            default:
                return '"UNKnown"';
        }
    }

    addNewClassFromChild(json, dependencies) {
        const className = json._name.charAt(0).toLowerCase() + json._name.substring(1);
        const isExits = this.dependencyIsInSources(className);
        dependencies.push(className);
        if (isExits) {
            return;
        }
        this.sources.push(new Source(className + '.json', this.root, json));
    }

    childIsArray(str) {
        return str.charAt(0) === '[' && str.charAt(str.length - 1) === ']';
    }

    addDependency(dependencies, dependency) {
        dependency = dependency.charAt(0).toLowerCase() + dependency.slice(1);
        if (!this.dependencyIsInSources(dependency)) {
            this.sources.push(new Source(dependency + '.json', this.root, {}));
        }
        dependencies.push(dependency);
    }

    dependencyIsInSources(dependency) {
        return this.sources.filter(source => source.shortName === dependency.toLowerCase()).length > 0;
    }

    starting() {
    }
}

module.exports = {
    init,
    Work
}
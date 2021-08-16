# ts-json-model

Read this in other languages:[简体中文](./Readme_zh-CN.md) | English

In the development process of `Typescript`, it is inevitable to write `Model`; for simple applications with few `Models`, there is nothing, but for complex applications with more `Model` and more complex,
Writing a `Model` becomes a boring and tedious physical language; the tool is born to solve a problem; of course, the premise is that the `json` file corresponding to the Model needs to be provided.
## Installation
```
$ npm install -g ts-json-model
```
## Usage
Output current version.
```
$ j2m --v
```
The default command line provided by the tool is `j2m`, and the default working directory is `./src/json` in the current directory.
The output directory is `./src/model`. Of course, a configuration file can also be provided to override the default configuration. The file name is`j2m.config.json`，The content is as follows：
```json
{
  "src": "./src/json",
  "output": "./src/model"
}
```
### Possible configuration keywords
- `_extend` Indicates the class to be inherited. If it does not exist, create an empty class.
- `_name`  The name of the current object class.
- `$` Custom class name, if it does not exist or create an empty class.
- `#{content}#` Comment on field/attribute

Next run
```
$ j2m
```
## demo
Take the example provided by the project as an example:

Structure：

![image](http://static.94-me.com/images/2021/07/1.jpg)

Run command: 
```
npm run j2m
```
You will see the following output in the console:

![image](http://static.94-me.com/images/2021/07/2.jpg)

Screenshot of the final result:

![image](http://static.94-me.com/images/2021/07/3.jpg)

Wow,the introduction is over, thank you！


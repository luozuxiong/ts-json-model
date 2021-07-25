# ts-json-model
在`Typescript`开发过程中，不可避免要编写`Model`；对于`Model`不多的简单应用倒是没有什么，但是对于复杂且`Model`较多、较复杂的应用，
编写`Model`就变成了枯燥、繁琐的体力话；该工具就是为了解决找个问题而生；当然前提指需要提供对应Model的`json`文件即可。

## 安装
```
$ npm install -g ts-json-model
```
## 使用
输出当前版本
```
$ j2m --v
```
工具默认提供命令行是`j2m`，默认的工作目录是当前目录下的`./src/json`，
输出目录是`./src/model`，当然也可以提供配置文件的形式覆盖默认的配置，文件名称是
`j2m.config.json`，配置如下：
```json
{
  "src": "./src/json",
  "output": "./src/model"
}
```
### 关键字
- `_extend`:表示要继承的类，如果不存在，那么新建一个空的类。
- `_name`: 当前对象类的名称。
- `$`: '自定义类名'，如果不存在活创建一个空的类。
- `#{content}#`: 字段/属性的注释

接下来运行
```
$ j2m
```
## demo
接下来以模块提供的example为例，讲解如何使用：

目录结构：

![image](http://static.94-me.com/images/2021/07/1.jpg)

运行
```
npm run j2m
```
过程

![image](http://static.94-me.com/images/2021/07/2.jpg)

结果

![image](http://static.94-me.com/images/2021/07/3.jpg)

介绍完毕，收工！


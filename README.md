# Gulp workflow
An example project to show how Gulp can do to improve a regular Angular.js project's workflow. 

一个展示如何通过使用 Gulp 自动化构建工具来改善传统 Angular.js 项目工作流的示例项目。

# 如何使用

把项目 clone 到本地之后，执行 `npm install` 来安装 Node.js 的依赖包。然后执行 `gulp init` 来初始化项目，最后执行 `gulp` 即可进入开发环境，至此即可开始开发 Angular.js 项目。

```bash
git clone https://github.com/serenader2014/gulp-workflow.git
cd gulp-workflow
npm install
gulp init
gulp
```

_需要注意的是， 安装 Node.js 依赖包需要 c++ 的编译环境。因此，需要根据系统来安装额外开发工具。具体可以查看 `node-gyp` 的说明：[https://github.com/TooTallNate/node-gyp#installation](https://github.com/TooTallNate/node-gyp#installation)_

# 它有什么用？

这个项目作为一个 seed project ，它的作用就是为一个新项目的开发提供一套快速开发的模板以及完善的配置。搭配 Gulp 它可以使得项目的开发变得非常容易。

我们知道，对于一个项目而言，往往可以分为两个阶段，一个是开发阶段，一个是编译阶段，即编译各种代码使之生成适合运行于生产环境中的代码。

在开发阶段，我们需要做：

- 实时监听文件变动，即时编译各种代码，如 Sass 和 CoffeeScript 等。
- 根据文件变动，实时刷新浏览器。
- 使用 jshint csslint 等对代码进行质量检查。

在编译阶段，我们需要做：

- 编译各种代码，如 Sass 和 CoffeeScript 等。
- 进行代码质量检查。
- 进行单元测试。
- 生成 image sprite 或者 iconfont 。
- 页面性能优化，对代码进行合并、压缩，对图片进行压缩，以及优化静态文件的缓存。
- 将最终生成的代码部署到服务器上。

以上工作如果没有一个可靠的自动化构建工具来完成的话，单靠人工完成，其工作量是非常大的，不仅琐屑无趣而且非常浪费时间，极大地降低了工作效率。然而，在这个项目中，它提供了一套完善的自动化工具来辅助开发。

# 项目目录结构分析

以下为本项目的大致目录：

```
|- build
|- dist
|- src
|    |- images
|    |    |- icon
|    |- scripts
|    |    |- app.js
|    |    |- module.js
|    |- styles
|    |    |- vars
|    |        |- color.scss
|    |        |- variable.scss
|    |    |- app.scss
|    |    |- module.scss
|    |- svgs
|    |- index.jade
|    |- module.jade
```

其中 `src` 目录即为项目的源代码目录，而 `dist` 目录则是开发环境下的代码目录，而 `build` 目录的文件则是编译后的适合运行于生产环境的代码。`dist` 跟 `build` 都不是我们应该关心的内容，因为这两个目录的代码都可以通过编译 `src` 内的源码来得到。这样做的好处是使得源码与生成的代码完全隔离，使得代码永远不会因为编译而改变。因此也不用担心因为某个失误而意外地修改了源码。

从目录结构中可以看到，这个项目中使用了 Jade 模板，CSS 预处理语言 Sass 。并且有多个 Jade 文件，意味着项目最终可能会有多个 HTML 文件。项目中还有一个专门放图片图标的 `icon` 目录，以及放矢量图标的 `svgs` 目录，它们是用来生成 Image sprite 和 Iconfonts 的。

实际上，在一个项目中，不太可能同时需要 Jade 模板、Sass 、Image sprite 、Iconfonts 这几个技术，而在这个项目中之所以都囊括进来是因为，我认为该项目应该为开发者提供多种选择，对于不需要的技术，只需要不去理会它即可。

# 它为我们做了哪些工作？

这个项目除了提供一套便于开发的模板之外，最强大之处就是它提供了一套配置好的 Gulp 配置文件。通过它可以实现很多自动化的过程。

## 文件实时监听，自动编译最新代码并且检查代码质量，并且自动刷新浏览器

Gulp 会监听 `/src` 目录下的 `js` 、`scss`、 `jade` 、`svg` 文件等的改动，一旦有改动则自动执行编译工作，并且将编译后的文件放在 `/dist` 目录中。而 Gulp 又会监听该目录的变动，若有变动则立即刷新浏览器。

在编译的过程中，通过利用 `jshint` 、`csslint` 、`htmlhint` 等插件，来对编译后的代码进行质量分析，如果代码不符合所指定的规范，则会弹出提示框，提示代码存在质量问题。

这个过程 Gulp 帮我们完成了开发阶段所需要做的内容。

## 性能优化，代码合并压缩，图片压缩，静态资源实行 revision ，自动部署到 Github Pages 上

Gulp 会分析每个 HTML 页面所引用的静态资源，然后分别为每个 HTML 页面的静态资源进行合并压缩，生成独立的文件，并且生成 revision 文件名，最终再修改原 HTML 文件的静态资源引用。

除此之外，Gulp 还会对该项目的所有图片进行压缩，以减少图片的文件大小，有利于图片的更快传输。

最后，Gulp 还可以将 `build` 目录下的所有文件自动部署到指定的 Github 仓库的 `gh-pages` 分支上，实现 Github Pages 的自动部署。

这个过程 Gulp 则帮我们完成了编译阶段的大部分工作。


# Gulp 配置文件介绍

这个项目最主要的  Gulp task 有以下几个：

| **Gulp Task**      | **描述**
|:------------------|:---------------
| `init`             | 初始化项目，会自动下载 bower 依赖包。
| `serve/default`    | 进入开发环境，会开始监听文件的变动，并且实时编译代码和刷新浏览器。
| `compile`          | 编译代码，生成能够在浏览器运行的代码。该任务由 `compile:js`、 `compile:css` 、 `compile:html` 任务构成。
| `build`            | 编译打包代码，生成适合在生产环境运行的代码。该任务由  `build:html` 、 `build:assets`、 `build:img`、`build:iconfont` 这几个任务构成。
| `deploy`           | 自动部署 `build` 目录下的所有文件到 Github Pages 上。


更详细的任务配置请查看 `gulpfile.js` 。

# Todo

- [ ] 添加单元测试和E2E测试
- [ ] 完善项目模板

# License

(The MIT License)

Copyright (c) 2015 serenader &lt;xsylive@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

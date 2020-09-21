# UP-2020083001

Default landing pages.

## Contributing

Ensure that Node.JS is installed. If not, you can download it [here](https://nodejs.org/en/).

Ensure that Git is installed.

### Preparing the dev environment

Clone the repository and enter the directory.

``` shell
git clone https://github.com/ghifari160/UP-2020083001
cd UP-2020083001
```

Install _all_ dependencies for this project.

``` shell
npm i
```

Build the development documentations

``` shell
npm run docs:dev
```

Run the server to generate the initial data.

``` shell
npm run start
```

Configure server port in `server.port` and dummy projects in `projects` in `data/config.json`.
Terminate the server by pressing <kbd>Ctrl</kbd> + <kbd>C</kbd>. Start the server again to reload the
configuration.

### Contributing changes

Submit changes through pull requests. Tag pull requests appropriately. Be sure to describe your
changes and the reasoning behind them on your pull request. Do _NOT_ bump your pull requests. Doing
so will only further delay the process. Once approved, standby to further assist the merging process.
Contributors with direct access to the repository may release changes, upon approval by the owner, by
following the [release guide](#packaging-for-release) bellow.

### Packaging for release

Make sure _all_ changes are committed, pushed to origin, and approved for release.

Build default pages.

``` shell
npm run pages:build
```

Build the public documentations

``` shell
npm run docs:build
```

Manually delete the following files and directories (ensure you store a backup if you intend on using the same dev workspace):

``` text
data/
dist/
node_modules/
script/
src/pages/
.babelrc
.gitattributes
.gitignore
jsdoc.json
webpack.config.js
```

Package up the remaining files and directories.

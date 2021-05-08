/**
 * Default pages building script
 */

const fs = require("fs");
const path = require("path");
const Logger = require("logger");

const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const webpackConfig = require("../webpack.config")("", "");

const buildLocation = "default";

let logger = new Logger();

/**
 * Stack of JS paths for caching
 *
 * @type {string}
 */
let jsStack = [];

/**
 * Stack of JS basenames
 *
 * @type {string}
 */
let jsBasenameStack = [];

/**
 * JS cache, keyed by path
 *
 * @type {string} JS file
 */
let jsCache = [];

/**
 * Stack of CSS paths for caching
 *
 * @type {string}
 */
let cssStack = [];

/**
 * Stack of CSS basenames
 *
 * @type {string}
 */
let cssBasenameStack = [];

/**
 * Queue of HTML for building
 *
 * @type {string}
 */
let htmlQ = [];

/**
 * CSS cache, keyed by path
 *
 * @type {string} CSS file
 */
let cssCache = [];

logger.log(Logger.LOG_LEVEL.INFO, `Preparing directories`);
try
{
    fs.mkdirSync(path.resolve(process.cwd(), buildLocation));
}
catch(err){}

logger.log(Logger.LOG_LEVEL.INFO, `Scanning Webpack configuration`);

jsStack.push(path.resolve(webpackConfig.output.path, webpackConfig.output.filename));
jsBasenameStack.push(webpackConfig.output.filename);

for(let i = 0; i < webpackConfig.plugins.length; i++)
{
    if(webpackConfig.plugins[i] instanceof MiniCssExtractPlugin)
    {
        cssStack.push(path.resolve(webpackConfig.output.path, webpackConfig.plugins[i].options.filename));
        cssBasenameStack.push(webpackConfig.plugins[i].options.filename);
    }
    else if(webpackConfig.plugins[i] instanceof HtmlWebpackPlugin)
        htmlQ.push(path.resolve(webpackConfig.output.path, webpackConfig.plugins[i].options.filename));
}

logger.log(Logger.LOG_LEVEL.INFO, `Found ${jsStack.length} script(s), ${cssStack.length} stylesheet(s), and ${htmlQ.length} HTML(s)!`);

logger.log(Logger.LOG_LEVEL.INFO, `Caching script(s)`);

for(let i = 0; i < jsStack.length; i++)
{
    try
    {
        jsCache[jsBasenameStack[i]] = fs.readFileSync(jsStack[i], { encoding: "utf8" });
    }
    catch(err)
    {
        logger.log(Logger.LOG_LEVEL.WARN, `Unable to cache ${jsStack[i]}`);
    }
}

logger.log(Logger.LOG_LEVEL.INFO, `${Object.keys(jsCache).length} script(s) cached!`);

logger.log(Logger.LOG_LEVEL.INFO, `Caching stylesheet(s)`);

for(let i = 0; i < cssStack.length; i++)
{
    try
    {
        cssCache[cssBasenameStack[i]] = fs.readFileSync(cssStack[i], { encoding: "utf8" });
    }
    catch(err)
    {
        logger.log(Logger.LOG_LEVEL.WARN, `Unable to cache ${cssStack[i]}`);
    }
}

logger.log(Logger.LOG_LEVEL.INFO, `${Object.keys(cssCache).length} sytlesheet(s) cached!`);

logger.log(Logger.LOG_LEVEL.INFO, `Building HTML(s)`);

while(htmlQ.length > 0)
{
    let htmlPath = htmlQ.shift();

    try
    {
        let html = fs.readFileSync(htmlPath, { encoding: "utf8" });

        for(let i = 0; i < jsBasenameStack.length; i++)
        {
            html = html.replace(`<script src="${jsBasenameStack[i]}"></script>`, `<script>${jsCache[jsBasenameStack[i]]}</script>`);
        }

        for(let i = 0; i < cssBasenameStack.length; i++)
        {
            html = html.replace(`<link href="${cssBasenameStack[i]}" rel="stylesheet">`, `<style>${cssCache[cssBasenameStack[i]]}</style>`);
        }

        html = html.replace(`<script src="${webpackConfig.output.filename}"></script>`, ``);

        fs.writeFileSync(path.resolve(process.cwd(), buildLocation, path.basename(htmlPath)), html);
    }
    catch(err)
    {
        log(Logger.LOG_LEVEL.WARN, `Unable to build ${htmlPath}`);
    }
}

logger.log(Logger.LOG_LEVEL.INFO, `HTML(s) built!`);

// logger.log(Logger.LOG_LEVEL.INFO, `Cleaning up`);

// try
// {
//     fs.rmdirSync(webpackConfig.output.path);
// }
// catch(err)
// {
//     logger.log(Logger.LOG_LEVEL.WARN, `Error while cleaning up`);
//     logger.log(Logger.LOG_LEVEL.WARN, err);
// }

logger.log(Logger.LOG_LEVEL.INFO, `Done!`);

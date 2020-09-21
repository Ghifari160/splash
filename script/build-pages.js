/**
 * Default pages building script
 */

const fs = require("fs"),
      path = require("path");

const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const { LOG_LEVEL, log } = require("../src/server/log");

const webpackConfig = require("../webpack.config")("", "");

const buildLocation = "default";

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

log(LOG_LEVEL.INFO, `Preparing directories`);
fs.mkdirSync(path.resolve(process.cwd(), buildLocation));

log(LOG_LEVEL.INFO, `Scanning Webpack configuration`);

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

log(LOG_LEVEL.INFO, `Found ${cssStack.length} stylesheet(s) and ${htmlQ.length} HTML(s)!`);

log(LOG_LEVEL.INFO, `Caching stylesheet(s)`);

for(let i = 0; i < cssStack.length; i++)
{
    try
    {
        cssCache[cssBasenameStack[i]] = fs.readFileSync(cssStack[i], { encoding: "utf8" });
    }
    catch(err)
    {
        log(LOG_LEVEL.WARN, `Unabled to cache ${cssStack[i]}`);
    }
}

log(LOG_LEVEL.INFO, `${cssCache.length} sytlesheet(s) cached!`);

log(LOG_LEVEL.INFO, `Building HTML(s)`);

while(htmlQ.length > 0)
{
    let htmlPath = htmlQ.shift();

    try
    {
        let html = fs.readFileSync(htmlPath, { encoding: "utf8" });

        for(let i = 0; i < cssBasenameStack.length; i++)
        {
            html = html.replace(`<link href="${cssBasenameStack[i]}" rel="stylesheet">`, `<style>${cssCache[cssBasenameStack[i]]}</style>`);
        }

        html = html.replace(`<script src="${webpackConfig.output.filename}"></script>`, ``);

        fs.writeFileSync(path.resolve(process.cwd(), buildLocation, path.basename(htmlPath)), html);
    }
    catch(err)
    {
        log(LOG_LEVEL.WARN, `Unabled to build ${htmlPath}`);
    }
}

log(LOG_LEVEL.INFO, `HTML(s) built!`);

// log(LOG_LEVEL.INFO, `Cleaning up`);

// try
// {
//     fs.rmdirSync(webpackConfig.output.path);
// }
// catch(err)
// {
//     log(LOG_LEVEL.WARN, `Error while cleaning up`);
//     log(LOG_LEVEL.WARN, err);
// }

log(LOG_LEVEL.INFO, `Done!`);
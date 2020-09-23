/**
 * Page loader
 * 
 * @module page-loader
 */

const fs = require("fs");

const COLOR = require("./color"),
      { LOG_LEVEL, log, log_request, log_redirect } = require("./log"),
      configLoader = require("./config-loader");

/**
 * Pages cached by path
 * 
 * @private
 * @type {string}
 */
let pagesByPath = [];

/**
 * Pages cached by ID
 * 
 * @private
 * @type {string}
 */
let pagesById = [];

/**
 * Loads and caches pages
 * 
 * @static
 * @param {string} path Path to page file
 * @param {string} [id] Page ID
 */
function loadPage(path, id)
{
    if(id === "undefined")
        id = path;

    try
    {
        let contents = fs.readFileSync(path, { encoding: "utf8" });

        pagesByPath[path] = contents;
        pagesById[id] = contents;
    }
    catch(err)
    {
        log(LOG_LEVEL.WARN, `Error loading page ${path}. Skipping!`);
    }
}

/**
 * Gets page from cache by ID
 * 
 * @static
 * @param {string} id Page ID
 * @returns {string|boolean} Page contents or `false` if not found
 */
function getPageById(id)
{
    if(id in pagesById)
        return pagesById[id];
    
    return false;
}

/**
 * Gets page from cache by path
 * 
 * @static
 * @param {string} path Path to page file
 * @returns {string|boolean} Page contents or `false` if not found
 */
function getPageByPath(path)
{
    if(path in pagesByPath)
        return pagesByPath[path];

    return false;
}

/**
 * Replace variables
 * 
 * @static
 * @param {string} page Page contents. Use {@link module:page-loader.getPageByPath} or {@link module:page-loader.getPageById}
 * @param {string} projectTitle Project title
 * @param {string} projectSubtitle Project subtitle. Generally it is the project ID
 * @returns {string} Page contents with variables replaced
 */
function replaceVariables(page, projectTitle, projectSubtitle)
{
    page = page.replace("${PROJECT.TITLE}", projectTitle);
    page = page.replace("${PROJECT.SUBTITLE}", projectSubtitle);

    page = page.replace("${FOOTER}", `<div class="footer__powered">Powered by <a href="https://github.com/ghifari160/splash">Splash</a> v${configLoader.getConfig().version}</div>`);

    return page;
}

module.exports =
{
    loadPage: loadPage,
    getPageById: getPageById,
    getPageByPath: getPageByPath,
    replaceVariables: replaceVariables
};
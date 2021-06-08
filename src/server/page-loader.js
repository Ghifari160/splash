/**
 * Page loader
 *
 * @module page-loader
 */

const fs = require("fs");

const Core = require("./core");
const configLoader = require("./config-loader");

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
    if(typeof id === "undefined")
        id = path;

    try
    {
        let contents = fs.readFileSync(path, { encoding: "utf8" });

        pagesByPath[path] = contents;
        pagesById[id] = contents;
    }
    catch(err)
    {
        Core.logger.log(Core.LOG_LEVEL.WARN, `Error loading page ${path}. Skipping!`);
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
 * __Note for v0.4.0+:__ This function now supports `pageTitle` parameter. To prevent breaking changes,
 * `projectSubtitle` is now an optional parameter. If `projectSubtitle` is unset, it is
 * assumed that `projectTitle` is the project subtitle, `pageTitle` is the project title, and
 * the page title is unconfigured (and will therefore be set equal to the project title).
 *
 * @static
 * @param {string} page Page contents. Use {@link module:page-loader.getPageByPath} or {@link module:page-loader.getPageById}
 * @param {string} pageTitle Page title (project title if `projectSubtitle` is not set)
 * @param {string} projectTitle Project title (project subtitle if `projectSubtitle` is not set)
 * @param {string} [projectSubtitle] Project subtitle. Generally it is the project ID
 * @param {string} [pageTheme] Page theme mode (`light` or `dark`)
 * @returns {string} Page contents with variables replaced
 */
function replaceVariables(page, pageTitle, projectTitle, projectSubtitle = null, pageTheme = null)
{
    let instance_id = configLoader.getConfig().instance.id;

    footer = `<div class="footer__modeswitch"><div class="switch"><div class="switch__slider"></div></div></div>`
           + `<div class="footer__powered">Powered by`
           + ` <a href="https://github.com/ghifari160/splash">Splash</a>`
           + ` v${configLoader.getConfig().version}</div>`
           + `<div class="footer__instance">${instance_id}</div>`;

    if(projectSubtitle == null)
    {
        projectSubtitle = projectTitle;
        projectTitle = pageTitle;
    }

    if(pageTheme == null)
        pageTheme = "";

    page = page.replace(/\$\{INSTANCE\.ID\}/gi, instance_id);

    page = page.replace(/\$\{PAGE\.THEME\}/gi, pageTheme);

    page = page.replace(/\$\{PROJECT\.PAGE\_TITLE\}/gi, pageTitle);

    page = page.replace(/\$\{PROJECT\.TITLE\}/gi, projectTitle);
    page = page.replace(/\$\{PROJECT\.SUBTITLE\}/gi, projectSubtitle);

    page = page.replace(/\$\{FOOTER\}/gi, footer);

    return page;
}

module.exports =
{
    loadPage: loadPage,
    getPageById: getPageById,
    getPageByPath: getPageByPath,
    replaceVariables: replaceVariables
};

const fs = require("fs");
const path = require("path");

const Core = require("./core");

const data_directory = "data";

/**
 * Projects Map
 * @private
 * @type {Map<string, module:DataLoader.Project>}
 */
let __projects = new Map();
/**
 * Projects relationships
 * @private
 * @type {Map<string, string>}
 */
let __projects_rel = new Map();

/**
 * Scan the contents data_directory for JSON files
 * @private
 * @returns {string[]} Absolute path to the contents of data_directory. Non-JSON files are ignored
 */
function __scanDataDirectory()
{
    let dataFiles = fs.readdirSync(data_directory);

    for(let i = 0; i < dataFiles.length; i++)
    {
        // Skip non-JSON files
        if(path.extname(dataFiles[i]) == ".json")
            dataFiles[i] = path.resolve(data_directory, dataFiles[i]);
    }

    return dataFiles;
}

/**
 * Parse the specified JSON file as project
 * @private
 * @param {string} projectPath Path to `project.json`
 */
function __parseProject(projectPath)
{
    let project = JSON.parse(fs.readFileSync(projectPath));
    let invalid = false;

    if(!project.hasOwnProperty("id") || project.id.length < 1)
    {
        invalid = true;

        Core.logger.log(Core.LOG_LEVEL.WARN, `Missing project ID for ${projectPath}! Skipping project`);
    }

    // Register a project relationship for internal redirects
    if(!invalid && project.hasOwnProperty("redirect"))
    {
        if(project.redirect.substring(0, 1) == "@")
            __projects_rel.set(project.id, project.redirect.substring(1));
    }

    __projects.set(project.id, project);
}

/**
 * Load all projects
 * @private
 */
function __loadProjects()
{
    let projectFiles = __scanDataDirectory();

    while(projectFiles.length > 0)
        __parseProject(projectFiles.shift());
}

/**
 * Validates projects relationships
 * @private
 */
function __validateProjectRels()
{
    for(const [id, dep] of __projects_rel)
    {
        if(!__projects.has(id) && !__projects.has(dep))
        {
            Core.logger.log(Core.LOG_LEVEL.WARN, `Invalid redirect target for ${id}: ${dep} is not a valid project ID. Skipping project`);

            __projects_rel.delete(id);
            __projects.delete(id);
        }
    }
}

/**
 * DataLoader submodule
 */
class DataLoader
{
    /**
     * Project configuration
     *
     * @typedef Project
     * @property {string} id Project ID
     * @property {string} [cn] Project common name (i.e. `Project`)
     * @property {string} [domain] Project domain (i.e. `localhost`)
     * @property {string} [redirect] Redirect target (i.e. `project.local`)
     * @property {string} [page] Page to be served (i.e. `project.html`)
     * @property {string} [page_title] Splash page title (i.e. `Splash`)
     * @property {string} [title] Splash project title (i.e. `Under Construction`)
     * @property {string} [subtitle] Splash project subtitle (i.e. `Secret Project`)
     */

    /**
     * Gets valid projects
     * @returns {Project[]} Projects
     */
    static getProjects()
    {
        let projects = [];

        __loadProjects();

        __validateProjectRels();

        if(__projects.size > 0)
            projects = Array.from(__projects).map(([ id, project ]) => project);

        return projects;
    }
}

module.exports = DataLoader;

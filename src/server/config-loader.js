/**
 * Config loader
 * 
 * @module config-loader
 */

const fs = require("fs");

const semver = require("semver");

const COLOR = require("./color"),
      { LOG_LEVEL, log, log_request } = require("./log");

const config_location = "data/config.json",
      version_current = "0.3.1";

/**
 * Sanitizes config version object
 * 
 * @private
 * @param {module:config-loader.Config} config Configuration object
 */
function __sanitizeConfigObj_version(config)
{
    if(!config.hasOwnProperty("version") || semver.lt(config.version, version_current))
    {
        config.version = version_current;

        log(LOG_LEVEL.WARN, `Version is outdated or missing. Upgrading config file`);
    }
}

/**
 * Server configuration
 * 
 * @typedef module:config-loader.Config_Server
 * @property {string} port **Deprecated. Use `server.listen_port` instead!** Listening port (i.e. `8080`)
 * @property {string} listen_port Listening port (i.e. `8080`)
 * @property {string} public_port Public port for reverse proxy (i.e. `80`)
 */

/**
 * Sanitizes config server object
 * 
 * @private
 * @param {module:config-loader.Config} config Configuration object
 */
function __sanitizeConfigObj_server(config)
{
    if(!config.hasOwnProperty("server"))
    {
        config.server = {};

        log(LOG_LEVEL.WARN, `Missing server configuration. Generating default server configuration`);
    }

    if(config.server.hasOwnProperty("port"))
        log(LOG_LEVEL.WARN, `server.port is deprecated and will not be supported in future versions`);

    if(!config.server.hasOwnProperty("listen_port"))
    {
        if(config.server.hasOwnProperty("port"))
        {
            config.server.listen_port = config.server.port;

            log(LOG_LEVEL.WARN, `Missing server.listen_port. Setting server.listen_port to server.port`);
        }
        else
        {
            config.server.listen_port = "8080";

            log(LOG_LEVEL.WARN, `Missing server.listen_port. Setting to default server listen port`);
        }
    }

    if(!config.server.hasOwnProperty("public_port"))
    {
        if(config.server.hasOwnProperty("port"))
        {
            config.server.public_port = config.server.port;

            log(LOG_LEVEL.WARN, `Missing server.public_port. Setting server.public_port to server.port`);
        }
        else if(config.server.hasOwnProperty("listen_port"))
        {
            config.server.public_port = config.server.listen_port;

            log(LOG_LEVEL.WARN, `Missing server.public_port. Setting server.public_port to server.listen_port`);
        }
        else
        {
            config.server.public_port = "8080";

            log(LOG_LEVEL.WARN, `Missing server.public_port. Setting to default server public port`);
        }
    }
}

/**
 * Project IDs
 * 
 * @private
 * @type {string[]} 
 */
let __projects = [];

/**
 * Working copy of project configurations (to prevent overwriting the config file)
 * 
 * @private
 * @type {module:config-loader.Config_Project[]}
 */
let __projectsCopy = [];

/**
 * @typedef module:config-loader.Config_Project_Relations
 * @private
 * @property {string} id Project ID of the relationship owner
 * @property {string} dep Project ID of the dependency
 */

/**
 * Project relationships
 * 
 * @private
 * @type {module:config-loader.Config_Project_Relations[]}
 */
let __projects_rel = [];

/**
 * @private
 * @typedef module:config-loader.Config_Project_Invalid
 * @property {number} [index]
 * @property {string} [id]
 */

/**
 * Invalid projects for deletion
 * 
 * @private
 * @type {module:config-loader.Config_Project_Invalid[]}
 * */
let __projects_invalid = [];

/**
 * Project configuration
 * 
 * @typedef module:config-loader.Config_Project
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
 * Sanitizes config projects array
 * 
 * @private
 * @param {module:config-loader.Config} config Configuration object
 */
function __sanitizeConfigObj_projects(config)
{
    if(!config.hasOwnProperty("projects"))
        config.projects = [];

    for(let i = 0; i < config.projects.length; i++)
    {
        let project = config.projects[i],
            invalid = false;

        if(!project.hasOwnProperty("id"))
        {
            invalid = true;

            __projects_invalid.push({ index: i });

            log(LOG_LEVEL.WARN, `Missing project id for project(${i})! Skipping project`);
        }

        if(!invalid && project.hasOwnProperty("redirect"))
        {
            if(project.redirect.substring(0, 1) == "@")
                __projects_rel.push({ id: project.id, dep: project.redirect.substring(1) });
        }

        __projects.push(project.id);
        __projectsCopy.push(project);
    }
}

/**
 * Verifies project relationships
 * @private
 */
function __sanitizeConfigObj_verifyProjectRelations()
{
    let invalid_rels_indices = [],
        opcount = 0;

    for(let i = 0; i < __projects_rel.length; i++)
    {
        if(!__projects_rel[i].hasOwnProperty("id") || !__projects_rel[i].hasOwnProperty("dep"))
            invalid_rels_indices.push(i);
        else if(!__projects.includes(__projects_rel[i].id))
            invalid_rels_indices.push(i);
        else if(!__projects.includes(__projects_rel[i].dep))
        {
            invalid_rels_indices.push(i);
            __projects_invalid.push({ id: __projects_rel[i].id });
        }
    }

    for(let i = 0; i < invalid_rels_indices.length; i++)
    {
        __projects_rel.splice(invalid_rels_indices[i] - opcount, 1);
        opcount++;
    }
}

/**
 * Removes invalid projects
 * @private
 */
function __sanitizeConfigObj_removeInvalidProjects()
{
    let opcount = 0;

    for(let i = 0; i < __projects_invalid.length; i++)
    {
        if(__projects_invalid[i].hasOwnProperty("index"))
        {
            __projects.splice(__projects_invalid[i].index - opcount, 1);
            __projectsCopy.splice(__projects_invalid[i].index - opcount, 1);
            opcount++;
        }
        else if(__projects_invalid[i].hasOwnProperty("id"))
        {
            let p = __projects.indexOf(__projects_invalid[i].id)
            if(p > -1)
            {
                __projects.splice(p, 1);
                __projectsCopy.splice(p, 1);
            }

            opcount++;
        }
    }
}

/**
 * Configuration object
 * 
 * @typedef module:config-loader.Config
 * @property {string} version Version of the generating app
 * @property {module:config-loader.Config_Server} server Server configuration
 * @property {module:config-loader.Config_Project[]} projects Projects configuration
 */

/**
 * Sanitizes config object
 * 
 * @private
 * @param {string} configStr JSON string of the configuration object
 * @param {boolean} [sanitizeVersion] Sanitize the version configuration object. If unset, the object will be sanitized
 */
function __sanitizeConfigObj(configStr, sanitizeVersion = true)
{
    let config = JSON.parse(configStr);

    if(sanitizeVersion)
        __sanitizeConfigObj_version(config);

    __sanitizeConfigObj_server(config);

    __sanitizeConfigObj_projects(config);

    __sanitizeConfigObj_verifyProjectRelations();

    __sanitizeConfigObj_removeInvalidProjects(config);

    return config;
}

/**
 * Loads the configuration file to memory
 * 
 * @private
 * @param {string} path Path to configuration file
 */
function __loadConfig(path)
{
    let configStr;
    try
    {
        configStr = fs.readFileSync(path, { encoding: "utf8" });
    }
    catch(err)
    {
        configStr = "{}";
    }

    return configStr;
}

/**
 * Writes the configuration object to file
 * 
 * @private
 * @param {string} path Path to configuration file
 */
function __writeConfig(config, path)
{
    let str = JSON.stringify(config, null, 4);

    fs.writeFileSync(path, str);
}

/**
 * Loads the configuration file into memory and construct the sanitized object
 * 
 * @static
 * @param {boolean} [sanitizeVersion] Sanitize the version configuration object. If unset, the object will be sanitized
 * @returns {module:config-loader.Config} Sanitized configuration object
 */
function getConfig(sanitizeVersion = true)
{
    let config = __sanitizeConfigObj(__loadConfig(config_location), sanitizeVersion);

    __writeConfig(config, config_location);

    config.projects = __projectsCopy;
    config.__projects = __projects;

    return config;
}

module.exports =
{
    getConfig: getConfig
};

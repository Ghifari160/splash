/**
 * Config loader
 *
 * @module config-loader
 */

const fs = require("fs");
const semver = require("semver");
const { v4: uuidv4 } = require("uuid");

const Core = require("./core");

const legacy_config_location = "data/config.json";
const config_location = "config.json";
const version_current = "0.5.1";

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

        Core.logger.log(Core.LOG_LEVEL.WARN, `Version is outdated or missing. Upgrading config file`);
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

        Core.logger.log(Core.LOG_LEVEL.WARN, `Missing server configuration. Generating default server configuration`);
    }

    if(config.server.hasOwnProperty("port"))
        Core.logger.log(Core.LOG_LEVEL.WARN, `server.port is deprecated and will not be supported in future versions`);

    if(!config.server.hasOwnProperty("listen_port"))
    {
        if(config.server.hasOwnProperty("port"))
        {
            config.server.listen_port = config.server.port;

            Core.logger.log(Core.LOG_LEVEL.WARN, `Missing server.listen_port. Setting server.listen_port to server.port`);
        }
        else
        {
            config.server.listen_port = "8080";

            Core.logger.log(Core.LOG_LEVEL.WARN, `Missing server.listen_port. Setting to default server listen port`);
        }
    }

    if(!config.server.hasOwnProperty("public_port"))
    {
        if(config.server.hasOwnProperty("port"))
        {
            config.server.public_port = config.server.port;

            Core.logger.log(Core.LOG_LEVEL.WARN, `Missing server.public_port. Setting server.public_port to server.port`);
        }
        else if(config.server.hasOwnProperty("listen_port"))
        {
            config.server.public_port = config.server.listen_port;

            Core.logger.log(Core.LOG_LEVEL.WARN, `Missing server.public_port. Setting server.public_port to server.listen_port`);
        }
        else
        {
            config.server.public_port = "8080";

            Core.logger.log(Core.LOG_LEVEL.WARN, `Missing server.public_port. Setting to default server public port`);
        }
    }
}

/**
 * Instance configuration
 *
 * @typedef module:config-loader.Config_Instance
 * @property {string} id Instance ID
 */

/**
 * Sanitizes config instance object
 * @param {module:config-loader.Config} config Configuration object
 */
function __sanitizeConfigObj_instance(config)
{
    if(!config.hasOwnProperty("instance"))
        config.instance = {};

    // Generate instance.id from UUIDv4 if not present
    if(!config.instance.hasOwnProperty("id"))
    {
        let message = "Missing instance.id. ";

        if(typeof process.env.SPLASH_INSTANCE_ID !== "undefined" && process.env.SPLASH_INSTANCE_ID.length > 0)
        {
            config.instance.id = process.env.SPLASH_INSTANCE_ID;
            message += "Setting instance ID from environment variable";
        }
        else
        {
            config.instance.id = uuidv4();
            message += "Generating a random ID.";
        }

        Core.logger.log(Core.LOG_LEVEL.WARN, message);
    }
}

/**
 * Configuration object
 *
 * @typedef module:config-loader.Config
 * @property {string} version Version of the generating app
 * @property {module:config-loader.Config_Instance} instance Instance configuration
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

    __sanitizeConfigObj_instance(config);

    __sanitizeConfigObj_server(config);

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
    let config;

    // Missing config.json
    if(!fs.existsSync(config_location))
    {
        // Read from data/config.json
        if(fs.existsSync(legacy_config_location))
        {
            config = __sanitizeConfigObj(__loadConfig(legacy_config_location), sanitizeVersion);

            Core.logger.log(Core.LOG_LEVEL.WARN, "config.json exists in data/ directory. This is legacy behavior. Moving config.json root Splash directory");
        }
        // Create config.json
        else
            config = __sanitizeConfigObj("{}", sanitizeVersion);
    }
    // Read from config.json
    else
        config = __sanitizeConfigObj(__loadConfig(config_location), sanitizeVersion);

    // Save into config.json
    __writeConfig(config, config_location);

    return config;
}

module.exports =
{
    getConfig: getConfig
};

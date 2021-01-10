const fs = require("fs"),
      path = require("path"),
      readline = require("readline");

const express = require("express");

const COLOR = require("./color"),
      { LOG_LEVEL, log, log_request, log_redirect } = require("./log"),
      configLoader = require("./config-loader"),
      { errorReqStack: errReqStack, errorHandler } = require("./error-handler"),
      { loadPage, getPageById, getPageByPath, replaceVariables } = require("./page-loader");

/**
 * Timeout for graceful shutdown attempt
 * 
 * @private
 * @type {number}
 */
const shutdownTimeout = 120000;

let config,
    config_old,
    server,
    server_init = false,
    connections = [];

const app = express();

/**
 * Shutdown the process
 * 
 * By default, it will attempt to gracefully shutdown the server by closing all remaining
 * connections before shutting down the process. If the forceful shutdown flag is set, no attempt
 * will be made to close the remaining connections.
 * 
 * @private
 * @param {boolean} [force] Forceful shutdown flag
 */
function shutdown(force = false)
{
    if(force)
        process.exit();
        
    // Gracefully close remaining connections
    server.close(() =>
    {
        process.exit();
    });

    setTimeout(() =>
    {
        log(LOG_LEVEL.SEVERE, "Could not close connections in time! Forcefully shutting down.");

        process.exit(1);
    }, shutdownTimeout);
}

/**
 * SIG{QUIT} handler helper function
 * 
 * @private
 * @param {string} signal Signal type (i.e. `SIGINT` or `SIGTERM`)
 * @param {boolean} [force] Forceful shutdown flag
 */
function __sigquit(signal, force = false)
{
    log(LOG_LEVEL.INFO, `${signal.toUpperCase()} caught! Exiting...`);

    shutdown(force);
}

/**
 * SIGHUP handler helper function
 * 
 * @private
 */
function __sigusr2()
{
    log(LOG_LEVEL.INFO, "SIGUSR2 caught! Reloading configuration and cache...");

    __init();
}

/**
 * Initialization logger helper function
 * 
 * @private
 * @param {module:log.LOG_LEVEL} level Log level
 * @param {string} message Message to log
 */
function __log_init(level, message)
{
    if(process.env.NODE_ENV === undefined || process.env.NODE_ENV === "development")
        log(level, `[INIT] ${message}`);
}

/**
 * Loads the server configuration
 * 
 * @private
 * @param {boolean} [sanitizeVersion] Sanitize the version configuration object. If unset, the object will be sanitized
 */
function __init_loadConfig(sanitizeVersion = true)
{
    __log_init(LOG_LEVEL.INFO, "Loading configuration");

    config = configLoader.getConfig(sanitizeVersion);
}

/**
 * Scans projects configuration and caches custom pages
 * 
 * @private
 */
function __init_scanProjects()
{
    __log_init(LOG_LEVEL.INFO, "Scanning projects configuration and cache custom pages");

    // Scan projects configuration and load and cache custom pages
    for(let i = 0; i < config.projects.length; i++)
    {
        if(config.projects[i].hasOwnProperty("page"))
        {
            if(!fs.existsSync(path.resolve(process.cwd(), config.projects[i].page)))
            {
                log(LOG_LEVEL.WARN, `Invalid page for project ${config.projects[i].id}: ${config.projects[i].page}. Setting to root`);

                config.projects[i].page = "";
                delete config.projects[i].page;
            }
            else
                loadPage(path.resolve(process.cwd(), config.projects[i].page), config.projects[i].id);
        }
    }
}

/**
 * Cache default pages
 * 
 * @private
 */
function __init_cacheDefaultPages()
{
    __log_init(LOG_LEVEL.INFO, "Caching default pages to memory");
    
    // Load and cache default pages
    loadPage(path.resolve(process.cwd(), "default/error.html"), "ERROR");
    loadPage(path.resolve(process.cwd(), "default/splash.html"), "SPLASH");
}

/**
 * Verify error page configuration and cache custom error page
 * 
 * @private
 */
function __init_verifyErrorPage()
{
    __log_init(LOG_LEVEL.INFO, "Verifying error page configuration");
    
    // Verify error page configuration
    if(config.server.hasOwnProperty("error_page"))
    {
        if(!fs.existsSync(path.resolve(process.cwd(), config.server.error_page)))
        {
            config.server.error_page = path.resolve(process.cwd(), "default/error.html");
            log(LOG_LEVEL.WARN, `Invalid error page configuration. Setting to default`);
        }
        else
           loadPage(path.resolve(process.cwd(), config.server.error_page), "ERROR");
    }
    else
        config.server.error_page = path.resolve(process.cwd(), "default/error.html");
}

/**
 * Check for Non-Hotreloadable (NHR) _configuration_ changes
 * 
 * @private
 */
function __init_checkForNHRChanges()
{
    let changes = [];
    
    if(config_old.version != config.version)
        changes.push("version");

    if(config_old.server.listen_port != config.server.listen_port)
        changes.push("server.listen_port");
    
    if(config_old.server.public_port != config.server.public_port)
        changes.push("server.public_port");
    
    if(changes.length > 0)
    {
        log(LOG_LEVEL.WARN, `Non-hotreloadable configuration changes detected! These changes will not apply until a server restart!`);
        log(LOG_LEVEL.WARN, `Changed keys: ${changes.join(" ")}`);
    }
}

/**
 * Initialize the server
 * 
 * @private
 */
function __init()
{
    if(server_init)
        config_old = config;

    __init_loadConfig(!server_init);

    if(server_init)
        __init_checkForNHRChanges();

    __init_cacheDefaultPages();
    __init_verifyErrorPage();
    __init_scanProjects();

    server_init = true;
}

readline.emitKeypressEvents(process.stdin);
if(process.stdin.isTTY)
    process.stdin.setRawMode(true);

process.on("SIGINT", () =>
{
    __sigquit("sigint");
});

process.on("SIGTERM", () =>
{
    __sigquit("sigterm");
});

process.on("SIGUSR2", () =>
{
    __sigusr2();
});

process.stdin.on("keypress", (str, key) =>
{
    if(key.ctrl && key.name === "c")
        __sigquit("sigint");
    else if(key.ctrl && key.name === "t")
        __sigquit("sigterm", true);
    else if(key.ctrl && key.name === "r")
        __sigusr2();
});

__init();

server = app.listen(config.server.listen_port, () =>
{
    log(LOG_LEVEL.INFO, `Server listening on ${config.server.listen_port}`);
});

server.on("connection", (connection) =>
{
    connections.push(connection);
    connection.on("close", () =>
    {
        connections = connections.filter(curr => curr !== connection);
    });
});

// Handler: Static assets
// Static assets are served from ./static through //HOSTNAME:PORT/static/
app.get("/static/*", (req, res, next) =>
{
    let exec_start = new Date();

    errReqStack.push({ exec_start: exec_start, project_id: "STATIC" });

    fs.stat(path.resolve(process.cwd(), req.path.substring(1)), (err, stat) =>
    {
        if(err)
            next(err);
        else
        {
            res.sendFile(path.resolve(process.cwd(), req.path.substring(1)));

            log_request(LOG_LEVEL.INFO, req.method, req.path, req.hostname, "STATIC", 200, exec_start);
        }
    });
});

// Handler: Projects
// Projects are configured through data/config.json
app.get("/", (req, res) =>
{
    let exec_start = new Date(),
        project_id;

    let projectIndex = -1;

    // Linearly for project configuration by domain
    for(let i = 0; i < config.projects.length; i++)
    {
        if(config.projects[i].domain == req.hostname)
            projectIndex = i;
    }

    // Assume project ID to be the request hostname if no configuration is found
    if(projectIndex < 0)
        project_id = req.hostname;
    else
        project_id = config.__projects[projectIndex];

    errReqStack.push({ exec_start: exec_start, project_id: project_id });

    let page, page_title, title, subtitle;

    // Assign splash properties from project config
    if(projectIndex > -1)
    {
        // Retrieve custom or default splash page from cache
        if(!config.projects[projectIndex].hasOwnProperty("page"))
            page = getPageById("SPLASH");
        else
            page = getPageById(config.projects[projectIndex].id);

        // Assign splash title
        if(!config.projects[projectIndex].hasOwnProperty("title"))
            title = "Under Construction";
        else
            title = config.projects[projectIndex].title;

        // Assign splash page title
        if(!config.projects[projectIndex].hasOwnProperty("page_title"))
            page_title = title;
        else
            page_title = config.projects[projectIndex].page_title;

        // Assign splash subtitle
        if(!config.projects[projectIndex].hasOwnProperty("subtitle"))
        {
            if(!config.projects[projectIndex].hasOwnProperty("cn"))
                subtitle = project_id;
            else
                subtitle = config.projects[projectIndex].cn;
        }
        else
            subtitle = config.projects[projectIndex].subtitle;
    }
    // Assume splash properties for unconfigured projects
    else
    {
        page = getPageById("SPLASH");

        title = "Under Construction";
        page_title = title;
        subtitle = project_id;
    }

    // Redirect to target
    if(projectIndex > -1 && config.projects[projectIndex].hasOwnProperty("redirect"))
    {
        let red = config.projects[projectIndex].redirect;

        // Redirect to parent project
        if(red.substring(0, 1) == "@")
        {
            red = config.projects[config.__projects.indexOf(red.substring(1))].domain;

            res.redirect(302, `//${red}:${config.server.public_port}/`);

            log_redirect(LOG_LEVEL.INFO, req.method, req.path, req.hostname, red, project_id, 302, exec_start);
        }
        // Redirect to any target
        else
        {
            res.redirect(302, red);

            log_redirect(LOG_LEVEL.INFO, req.method, req.path, req.hostname, red, 302, project_id, exec_start);
        }
    }
    // Serve splash page
    else
    {
        if(!page)
        {
            res.send(title);
            res.send(subtitle);
        }
        else
        {
            page = replaceVariables(page, page_title, title, subtitle);

            res.send(page);
        }

        log_request(LOG_LEVEL.INFO, req.method, req.path, req.hostname, project_id, 200, exec_start);
    }
});

// Handler: Default
// Unknown requests method and path will return 404
app.all("*", (req, res, next) =>
{
    let exec_start = new Date();

    errReqStack.push({ exec_start: exec_start, project_id: "INVALID" });

    next({});
});

// Handler: Error
// Register custom Express error handler from error-handler module
app.use(errorHandler);

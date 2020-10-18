const fs = require("fs"),
      path = require("path");

const express = require("express");

const COLOR = require("./color"),
      { LOG_LEVEL, log, log_request, log_redirect } = require("./log"),
      configLoader = require("./config-loader"),
      { errorReqStack: errReqStack, errorHandler } = require("./error-handler"),
      { loadPage, getPageById, getPageByPath, replaceVariables } = require("./page-loader");

let config = configLoader.getConfig();

const app = express();

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

// Load and cache default pages
loadPage(path.resolve(process.cwd(), "default/error.html"), "ERROR");
loadPage(path.resolve(process.cwd(), "default/splash.html"), "SPLASH");

// Verify error page
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

app.listen(config.server.listen_port, () =>
{
    log(LOG_LEVEL.INFO, `Server listening on ${config.server.listen_port}`);
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

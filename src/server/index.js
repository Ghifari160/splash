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

app.listen(config.server.port, () =>
{
    log(LOG_LEVEL.INFO, `Server listening on ${config.server.port}`);
});

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
        // if(err && err.code === "ENOENT")
        // {
        //     res.status(404);
        //     res.send("404 Not Found.");

        //     log_request(LOG_LEVEL.INFO, req.method, req.path, req.hostname, "STATIC", 404, exec_start);
        // }
        // else if(err)
        // {
        //     res.status(500)
        //     res.send("500 Internal Error.");

        //     log_request(LOG_LEVEL.INFO, req.method, req.path, req.hostname, "STATIC", 500, exec_start);
        // }
        // else
        // {
        //     res.sendFile(path.resolve(process.cwd(), req.path.substring(1)));

        //     log_request(LOG_LEVEL.INFO, req.method, req.path, req.hostname, "STATIC", 200, exec_start);
        // }
    });
});

app.get("/", (req, res) =>
{
    let exec_start = new Date(),
        project_id;

    let projectIndex = -1;

    for(let i = 0; i < config.projects.length; i++)
    {
        if(config.projects[i].domain == req.hostname)
            projectIndex = i;
    }

    if(projectIndex < 0)
        project_id = req.hostname;
    else
        project_id = config.__projects[projectIndex];

    errReqStack.push({ exec_start: exec_start, project_id: project_id });

    if(projectIndex > -1 && config.projects[projectIndex].hasOwnProperty("page"))
    {
        let page = getPageById(config.projects[projectIndex].id);

        if(!page)
        {
            res.send("Under Construction");
            res.send(config.projects[projectIndex].id);
        }
        else
        {
            page = replaceVariables(page, "Under Construction", config.projects[projectIndex].id);

            res.send(page);
        }

        log_request(LOG_LEVEL.INFO, req.method, req.path, req.hostname, config.projects[projectIndex].id, 200, exec_start);
    }
    else if(projectIndex > -1 && config.projects[projectIndex].hasOwnProperty("redirect"))
    {
        let red = config.projects[projectIndex].redirect;

        if(red.substring(0, 1) == "@")
        {
            red = config.projects[config.__projects.indexOf(red.substring(1))].domain;

            res.redirect(302, `//${red}:${config.server.port}/`);

            log_redirect(LOG_LEVEL.INFO, req.method, req.path, req.hostname, red, config.projects[projectIndex].id, 302, exec_start);
        }
        else
        {
            res.redirect(302, red);

            log_redirect(LOG_LEVEL.INFO, req.method, req.path, req.hostname, red, 302, config.projects[projectIndex].id, exec_start);
        }
    }
    else
    {
        let page = getPageById("SPLASH");

        if(!page)
        {
            res.send("Under Construction");
            res.send(config.projects[projectIndex].id);
        }
        else
        {
            page = replaceVariables(page, "Under Construction", (projectIndex > -1) ? config.projects[projectIndex].id : req.hostname);

            res.send(page);
        }

        log_request(LOG_LEVEL.INFO, req.method, req.path, req.hostname, (projectIndex > -1) ? config.projects[projectIndex].id : req.hostname, 200, exec_start);
    }
});

app.all("*", (req, res, next) =>
{
    let exec_start = new Date();

    errReqStack.push({ exec_start: exec_start, project_id: "INVALID" });

    next({});

    // res.status(404);
    // res.sendFile(path.resolve(__dirname, "../public/404.html"));

    // log_request(LOG_LEVEL.INFO, req.method, req.path, req.hostname, "INVALID", 404, exec_start);
});

app.use(errorHandler);
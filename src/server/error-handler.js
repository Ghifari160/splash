/**
 * Express Error Handler
 * 
 * @module error-handler
 */

const COLOR = require("./color"),
      { LOG_LEVEL, log, log_request, log_redirect } = require("./log"),
      configLoader = require("./config-loader"),
      { getPageById, replaceVariables } = require("./page-loader");

/**
 * @typedef module:error-handler.Request
 * 
 * @property {Date} exec_start Request processing start time
 * @property {string} project_id Project ID of the response
 */

/**
 * Request stack for error tracing
 * 
 * @static
 * @type {module:error-handler.Request[]}
 * 
 */
let errorReqStack = [];

/**
 * Express error handler.
 * 
 * @static
 * @param {object} err 
 * @param {object} req 
 * @param {object} res 
 * @param {function} next 
 */
function errorHandler(err, req, res, next)
{
    let request = errorReqStack.pop(),
        status = 500,
        resp, respFile;

    if((err && err.code === "ENOENT") || !(err instanceof Error))
        status = 404;

    switch(status)
    {
        case 404:
            resp = "Not Found.";
            break;
        
        case 500:
        default:
            resp = "Internal Error.";
            break;
    }

    res.status(status);
    
    respFile = getPageById("ERROR");

    if(respFile)
    {
        respFile = replaceVariables(respFile, null, "INVALID");
        respFile = respFile.replace(/\$\{ERROR\.MESSAGE\}/gi, resp);

        res.send(respFile);
    }
    else
        res.send(`${status} ${resp}`);

    log_request(LOG_LEVEL.INFO, req.method, req.path, req.hostname, request.project_id, status, request.exec_start);
}

module.exports =
{
    errorReqStack: errorReqStack,
    errorHandler: errorHandler
};

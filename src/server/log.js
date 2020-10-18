/**
 * Log module
 * 
 * @module log
 */

const COLOR = require("./color.js");

/**
 * @typedef module:log.LOG_LEVEL
 * 
 * @property {string} INFO
 * @property {string} WARN
 * @property {string} SEVERE
 */
const LOG_LEVEL =
{
    INFO: `${COLOR.FGCYAN}INFO${COLOR.RESET}`,
    WARN: `${COLOR.FGYELLOW}WARN${COLOR.RESET}`,
    SEVERE: `${COLOR.FGRED}SEVERE${COLOR.RESET}`
};

/**
 * Gets timestamp
 * 
 * @private
 * @param {Date} date 
 */
function __getTimestamp(date)
{
    let timestamp = "";

    timestamp += `${date.getUTCFullYear()}-`;
    timestamp += (date.getUTCMonth() < 10) ? `0${date.getUTCMonth()}-` : `${date.getUTCMonth()}-`;
    timestamp += (date.getUTCDate() < 10) ? `0${date.getUTCDate()} ` : `${date.getUTCDate()} `;

    timestamp += (date.getUTCHours() < 10) ? `0${date.getUTCHours()}:` : `${date.getUTCHours()}:`;
    timestamp += (date.getUTCMinutes() < 10) ? `0${date.getUTCMinutes()}:` : `${date.getUTCMinutes()}:`;
    timestamp += (date.getUTCSeconds() < 10) ? `0${date.getUTCSeconds()}` : `${date.getUTCSeconds()}`;

    return timestamp;
}

/**
 * Creates a log entry
 * 
 * @static
 * @param {module:log.LOG_LEVEL} level Log level
 * @param {string} message Message to log
 */
function log(level, message)
{
    process.stdout.write(`[${__getTimestamp(new Date())}] ${level} ${message}\n`);
}

/**
 * Formats HTTP response code
 * 
 * @private
 * @param {number} code HTTP response code
 * 
 * @returns {string} Formatted _and colorized_ HTTP response code
 */
function __formatHttpCode(code)
{
    switch(code)
    {
        case 200:
            code = `${COLOR.FGGREEN}${code}${COLOR.RESET}`;
            break;
        
        case 301:
        case 302:
            code = `${COLOR.FGYELLOW}${code}${COLOR.RESET}`;
            break;
        
        default:
            code = `${COLOR.FGRED}${code}${COLOR.RESET}`;
    }

    return code;
}

/**
 * Logs HTTP request
 * 
 * @static
 * @param {module:log.LOG_LEVEL} level Log level. Under normal condition _(including during HTTP errors)_, the log level should be `INFO`
 * @param {string} method Request method (i.e. `GET`)
 * @param {string} path Request path (i.e. `/`)
 * @param {string} domain Request domain/hostname (i.e. `localhost`)
 * @param {string} project_id Project ID of the request recipient (i.e. `ROOT`)
 * @param {number} code HTTP status code of the response (Normally `200`)
 * @param {Date} exec_start Request processing start time
 * @param {Date} [exec_end] Request processing end time
 */
function log_request(level, method, path, domain, project_id, code, exec_start, exec_end = new Date())
{
    log(level, `"${method.toUpperCase()} ${path}" ${domain} ${project_id} ${__formatHttpCode(code)} ${exec_end - exec_start}ms`);
}

/**
 * Logs HTTP redirects resulting from request
 * 
 * @static
 * @param {module:log.LOG_LEVEL} level Log level. Under normal condition _(including during HTTP errors)_, the log level should be `INFO`
 * @param {string} method Request method (i.e. `GET`)
 * @param {string} path Request path (i.e. `/`)
 * @param {string} origin_domain Request domain/hostname (i.e. `localhost`)
 * @param {string} dest_domain Destination domain/hostname of the redirect (i.e. `project.local`)
 * @param {string} project_id Project ID of the request recipient (i.e. `ROOT`)
 * @param {number} code HTTP status code of the redirect (Normally `302`)
 * @param {Date} exec_start Request processing start time
 * @param {Date} [exec_end] Request processing end time
 */
function log_redirect(level, method, path, origin_domain, dest_domain, project_id, code, exec_start, exec_end = new Date())
{
    log(level, `"${method.toUpperCase()} ${path}" ${origin_domain} => ${dest_domain} ${project_id} ${__formatHttpCode(code)} ${exec_end - exec_start}ms`);
}

module.exports =
{
    LOG_LEVEL: LOG_LEVEL,
    log: log,
    log_request: log_request,
    log_redirect: log_redirect
};

const Logger = require("logger");

class Core
{
    static logger;
    static LOG_LEVEL = Logger.LOG_LEVEL;
    static COLOR = Logger.COLOR;

    /**
     * Initiates Logger for this project
     * @static
     */
    static init_logger()
    {
        if(typeof Core.logger === "undefined")
            Core.logger = new Logger(process.stdout, process.stderr);
    }

    /**
     * Formats HTTP response code
     * @static
     * @param {number} code HTTP response code
     * @returns {string} Formatted _and colorized_ HTTP response code
     */
     static formatHttpCode(code)
     {
         switch(code)
         {
             case 200:
                 code = `${Core.COLOR.FGGREEN}${code}${Core.COLOR.RESET}`;
                 break;

             case 301:
             case 302:
                 code = `${Core.COLOR.FGYELLOW}${code}${Core.COLOR.RESET}`;
                 break;

             default:
                 code = `${Core.COLOR.FGRED}${code}${Core.COLOR.RESET}`;
         }

         return code;
     }

     /**
     * Logs HTTP request
     * @static
     * @param {module:Logger.LOG_LEVEL} level Log level. Under normal condition _(including during HTTP errors)_, the log level should be `INFO`
     * @param {string} method Request method (i.e. `GET`)
     * @param {string} path Request path (i.e. `/`)
     * @param {string} domain Request domain/hostname (i.e. `localhost`)
     * @param {string} project_id Project ID of the request recipient (i.e. `ROOT`)
     * @param {number} code HTTP status code of the response (Normally `200`)
     * @param {Date} exec_start Request processing start time
     * @param {Date} [exec_end] Request processing end time
     */
    static log_request(level, method, path, domain, project_id, code, exec_start, exec_end = new Date())
    {
        Core.logger.log(level, `"${method.toUpperCase()} ${path}" ${domain} ${project_id} ${Core.formatHttpCode(code)} ${exec_end - exec_start}ms`);
    }

    /**
     * Logs HTTP redirects resulting from request
     * @static
     * @param {module:Logger.LOG_LEVEL} level Log level. Under normal condition _(including during HTTP errors)_, the log level should be `INFO`
     * @param {string} method Request method (i.e. `GET`)
     * @param {string} path Request path (i.e. `/`)
     * @param {string} origin_domain Request domain/hostname (i.e. `localhost`)
     * @param {string} dest_domain Destination domain/hostname of the redirect (i.e. `project.local`)
     * @param {string} project_id Project ID of the request recipient (i.e. `ROOT`)
     * @param {number} code HTTP status code of the redirect (Normally `302`)
     * @param {Date} exec_start Request processing start time
     * @param {Date} [exec_end] Request processing end time
     */
    static log_redirect(level, method, path, origin_domain, dest_domain, project_id, code, exec_start, exec_end = new Date())
    {
        Core.logger.log(level, `"${method.toUpperCase()} ${path}" ${origin_domain} => ${dest_domain} ${project_id} ${Core.formatHttpCode(code)} ${exec_end - exec_start}ms`);
    }
}

module.exports = Core;

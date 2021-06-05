const fs = require("fs");
const path = require("path");
const assert = require("assert");

describe("error-handler", function()
{
    let Core;
    let DataLoader;
    let PageLoader;

    let ErrorHandler;

    before(function()
    {
        Core = require("../../src/server/core");
        Core.logger = { log: function() {} };

        DataLoader = require("../../src/server/data-loader");
        PageLoader = require("../../src/server/page-loader");

        ErrorHandler = require("../../src/server/error-handler");
    });

    after(function()
    {
        delete require.cache[require.resolve("../../src/server/core")];
        delete require.cache[require.resolve("../../src/server/data-loader")];
        delete require.cache[require.resolve("../../src/server/page-loader")];

        delete require.cache[require.resolve("../../src/server/error-handler")];
    });

    describe("#errorHandler()", function()
    {
        let err;
        let req;
        let res;
        let next;

        let errReq;

        let statStack = [];
        let respStack = [];

        describe("String response", function()
        {
            before(function()
            {
                req =
                {
                    path: "/dev/test",
                    hostname: "/dev/test",
                };

                res =
                {
                    status: function(code)
                    {
                        statStack.push(code);
                    },
                    send: function(resp)
                    {
                        respStack.push(resp);
                    },
                };
            });

            beforeEach(function()
            {
                statStack = [];
                respStack = [];

                err = new Error("/dev/test");

                errReq = { exec_start: new Date(), project: "/dev/test" };
            });

            let commonTests = [
                {
                    id: "404 request",
                    errCode: "ENOENT",
                    expected:
                    {
                        code: 404,
                        message: "404 Not Found.",
                    },
                },
                {
                    id: "500 request",
                    errCode: "",
                    expected:
                    {
                        code: 500,
                        message: "500 Internal Error.",
                    },
                },
            ];

            let dynamicTests = [
                {
                    id: "GET method",
                    beforeCallback: function()
                    {
                        req.method = "GET";
                    },
                    tests: commonTests,
                },
                {
                    id: "POST method",
                    beforeCallback: function()
                    {
                        req.method = "POST";
                    },
                    tests: commonTests,
                },
            ];

            dynamicTests.forEach(({ id, beforeCallback, tests }) =>
            {
                describe(id, function()
                {
                    before(beforeCallback);

                    tests.forEach(({ id, errCode, expected }) =>
                    {
                        it(id, function()
                        {
                            err.code = errCode;

                            ErrorHandler.errorReqStack.push(errReq);
                            ErrorHandler.errorHandler(err, req, res, next);

                            assert.strictEqual(statStack.shift(), expected.code, "Response status does not match expected.");
                            assert.strictEqual(respStack.shift(), expected.message, "Response message does not match expected.");
                        });
                    });
                });
            });
        });

        describe("Page response", function()
        {
            let page_path = path.resolve(__dirname, "../err.html");
            let page_contents = `<!DOCTYPE html>\n`
                             + `<html>\n`
                             + `<head>\n`
                             + `<meta charset="utf8>\n`
                             + `<title>\${ERROR.MESSAGE}</title>\n`
                             + `</head>\n`
                             + `<body>\n`
                             + `<h1>\${ERROR.MESSAGE}</h1>\n`
                             + `</body>\n`
                             + `</html>\n`;

            before(function()
            {
                req =
                {
                    path: "/dev/test",
                    hostname: "/dev/test",
                };

                res =
                {
                    status: function(code)
                    {
                        statStack.push(code);
                    },
                    send: function(resp)
                    {
                        respStack.push(resp);
                    },
                };

                if(fs.existsSync(page_path))
                    fs.renameSync(page_path, `${page_path}.old`);

                fs.writeFileSync(page_path, page_contents);

                PageLoader.loadPage(page_path, "ERROR");

                fs.unlinkSync(page_path);

                if(fs.existsSync(`${page_path}.old`))
                    fs.renameSync(`${page_path}.old`, page_path);
            });

            beforeEach(function()
            {
                statStack = [];
                respStack = [];

                err = new Error("/dev/test");

                errReq = { exec_start: new Date(), project: "/dev/test" };
            });

            let commonTests = [
                {
                    id: "404 request",
                    errCode: "ENOENT",
                    expected:
                    {
                        code: 404,
                        message: page_contents.replace(/\$\{ERROR\.MESSAGE\}/gi, "Not Found."),
                    },
                },
                {
                    id: "500 request",
                    errCode: "",
                    expected:
                    {
                        code: 500,
                        message: page_contents.replace(/\$\{ERROR\.MESSAGE\}/gi, "Internal Error."),
                    },
                },
            ];

            let dynamicTests = [
                {
                    id: "GET method",
                    beforeCallback: function()
                    {
                        req.method = "GET";
                    },
                    tests: commonTests,
                },
                {
                    id: "POST method",
                    beforeCallback: function()
                    {
                        req.method = "POST";
                    },
                    tests: commonTests,
                },
            ];

            dynamicTests.forEach(({ id, beforeCallback, tests }) =>
            {
                describe(id, function()
                {
                    before(beforeCallback);

                    tests.forEach(({ id, errCode, expected }) =>
                    {
                        it(id, function()
                        {
                            err.code = errCode;

                            ErrorHandler.errorReqStack.push(errReq);
                            ErrorHandler.errorHandler(err, req, res, next);

                            assert.strictEqual(statStack.shift(), expected.code, "Response status does not match expected.");
                            assert.strictEqual(respStack.shift(), expected.message, "Response message does not match expected.");
                        });
                    });
                });
            });
        });
    });
});

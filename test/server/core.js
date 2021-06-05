const fs = require("fs");
const path = require("path");
const assert = require("assert");
const Logger = require("logger");

const Core = require("../../src/server/core");

describe("Core", function()
{
    describe("#init_logger()", function()
    {
        it("initiates logger", function()
        {
            try
            {
                Core.init_logger();

                if(!Core.logger instanceof Logger)
                    assert.fail("Core.logger is not an instance of Logger");
            }
            catch(err)
            {
                assert.fail("Unable to initiate Logger.");
            }
        });
    });

    describe("#formatHttpCode()", function()
    {
        let tests = [
            {
                id: "200",
                code: 200,
                expected: `${Core.COLOR.FGGREEN}200${Core.COLOR.RESET}`,
            },
            {
                id: "301",
                code: 301,
                expected: `${Core.COLOR.FGYELLOW}301${Core.COLOR.RESET}`,
            },
            {
                id: "302",
                code: 302,
                expected: `${Core.COLOR.FGYELLOW}302${Core.COLOR.RESET}`,
            },
            {
                id: "default",
                code: -1,
                expected: `${Core.COLOR.FGRED}-1${Core.COLOR.RESET}`,
            },
        ];

        tests.forEach(({ id, code, expected }) =>
        {
            it(id, function()
            {
                assert.strictEqual(Core.formatHttpCode(code), expected, "Returned message does not match expected.");
            });
        });
    });

    describe("#log_request()", function()
    {
        it.skip("Correctly format requests", function()
        {

        });
    });

    describe("#log_redirect()", function()
    {
        it.skip("Correctly format redirects", function()
        {

        });
    });
});

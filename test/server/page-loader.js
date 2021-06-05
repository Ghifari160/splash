const fs = require("fs");
const path = require("path");
const assert = require("assert");

const datadir = path.resolve(__dirname, "../../data");
const configLoc = path.resolve(__dirname, "../../config.json");

const payload = `<!DOCTYPE html>`
              + `<html>`
              + `<head>`
              + `<meta charset="utf8">`
              + `<title>/dev/test Payload</title>`
              + `</head>`
              + `<body>`
              + `<h1>/dev/test Payload</h1>`
              + `</body>`
              + `</html>`;

const PageLoader = require("../../src/server/page-loader");

describe("page-loader", function()
{
    before(function()
    {
        if(fs.existsSync(datadir))
            fs.renameSync(datadir, `${datadir}.old`);

        if(fs.existsSync(configLoc))
            fs.renameSync(configLoc, `${configLoc}.old`);

        fs.mkdirSync(datadir);
    });

    after(function()
    {
        fs.rmdirSync(datadir, { recursive: true });

        if(fs.existsSync(`${datadir}.old`))
            fs.renameSync(`${datadir}.old`, datadir);

        if(fs.existsSync(`${configLoc}.old`))
            fs.renameSync(`${configLoc}.old`, configLoc);
    });

    describe("#loadPage()", function()
    {
        before(function()
        {
            fs.writeFileSync(path.resolve(datadir, "payload.html"), payload);
        });

        it("Loads page with specified ID", function()
        {
            try
            {
                PageLoader.loadPage(path.resolve(datadir, "payload.html"), "payload");
            }
            catch(err)
            {
                assert.fail("Unable to load payload page.");
            }
        });

        it("Loads page with unspecified ID", function()
        {
            try
            {
                PageLoader.loadPage(path.resolve(datadir, "payload.html"));
            }
            catch(err)
            {
                assert.fail("Unable to load payload page.");
            }
        });

        after(function()
        {
            fs.unlinkSync(path.resolve(datadir, "payload.html"));
        });
    });

    describe("#getPageById()", function()
    {
        it("Gets page by ID (specified)", function()
        {
            assert.strictEqual(PageLoader.getPageById("payload"), payload, "Loaded page does not match expected.");
        });

        it("Gets page by ID (generated from path)", function()
        {
            assert.strictEqual(PageLoader.getPageById(path.resolve(datadir, "payload.html")), payload, "Loaded page does not match expected.");
        });
    });

    describe("#getPageByPath()", function()
    {
        it("Gets page by path", function()
        {
            assert.strictEqual(PageLoader.getPageByPath(path.resolve(datadir, "payload.html")), payload, "Loaded page does not match expected.");
        });
    });

    describe("#replaceVariables()", function()
    {
        before(function()
        {
            let conf =
            {
                version: "0.4.0",
                instance: { id: "/dev/test" },
                server:
                {
                    listen_port: "8080",
                    public_port: "8080",
                },
            };

            fs.writeFileSync(configLoc, JSON.stringify(conf, null, 4));
        });

        after(function()
        {
            fs.unlinkSync(configLoc);
        });

        let payload = "${INSTANCE.ID}"
                 + "${PAGE.THEME}"
                 + "${PROJECT.PAGE_TITLE}"
                 + "${PROJECT.TITLE}"
                 + "${PROJECT.SUBTITLE}";

        it("Replace server variables with all parameters specified", function()
        {
            let actual = PageLoader.replaceVariables(payload, "Page Title", "Project Title", "Project Subtitle", "Dark Theme");

            let expected = payload;
            expected = expected.replace(/\$\{INSTANCE\.ID\}/gi, "/dev/test");

            expected = expected.replace(/\$\{PAGE\.THEME\}/gi, "Dark Theme");

            expected = expected.replace(/\$\{PROJECT\.PAGE\_TITLE\}/gi, "Page Title");

            expected = expected.replace(/\$\{PROJECT\.TITLE\}/gi, "Project Title");
            expected = expected.replace(/\$\{PROJECT\.SUBTITLE\}/gi, "Project Subtitle");

            assert.strictEqual(actual, expected, "Output does not match the expected values.");
        });

        it("Replace server variables with optional parameters unspecified", function()
        {
            let actual = PageLoader.replaceVariables(payload, "Project Title", "Project Subtitle");

            let expected = payload;
            expected = expected.replace(/\$\{INSTANCE\.ID\}/gi, "/dev/test");

            expected = expected.replace(/\$\{PAGE\.THEME\}/gi, "");

            expected = expected.replace(/\$\{PROJECT\.PAGE\_TITLE\}/gi, "Project Title");

            expected = expected.replace(/\$\{PROJECT\.TITLE\}/gi, "Project Title");
            expected = expected.replace(/\$\{PROJECT\.SUBTITLE\}/gi, "Project Subtitle");

            assert.strictEqual(actual, expected, "Output does not match the expected values.");
        });
    });
});

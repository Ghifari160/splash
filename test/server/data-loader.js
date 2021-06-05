const fs = require("fs");
const path = require("path");
const assert = require("assert");

const datadir = path.resolve(__dirname, "../../data");

describe("DataLoader", function()
{
    let Core;
    let DataLoader;

    before(function()
    {
        if(fs.existsSync(datadir))
            fs.renameSync(datadir, path.resolve(__dirname, "../../data.old"));

        fs.mkdirSync(datadir);
    });

    after(function()
    {
        if(fs.existsSync(path.resolve(__dirname, "../../data.old")))
        {
            fs.rmdirSync(datadir, { recursive: false });
            fs.renameSync(path.resolve(__dirname, "../../data.old"), datadir);
        }
    });

    beforeEach(function()
    {
        Core = require("../../src/server/core");
        Core.logger = { log: function() {} };

        DataLoader = require("../../src/server/data-loader");
    });

    afterEach(function()
    {
        let files = fs.readdirSync(datadir);

        while(files.length > 0)
            fs.unlinkSync(path.resolve(datadir, files.shift()));
    });

    describe("#getProjects()", function()
    {
        afterEach(function()
        {
            delete require.cache[require.resolve("../../src/server/core")];
            delete require.cache[require.resolve("../../src/server/data-loader")];
        });

        describe("valid project", function()
        {
            it("default page customization", function()
            {
                let projects = [
                    {
                        id: "project",
                        domain: "project.domain",
                        page_title: "Project Page Title",
                        title: "Project Title",
                        subtitle: "Project Subtitle"
                    }
                ];
                fs.writeFileSync(path.resolve(datadir, "project.json"), JSON.stringify(projects[0], null, 4));

                assert.deepStrictEqual(DataLoader.getProjects(), projects);
            });

            it("internal redirect target", function()
            {
                let projects = [
                    {
                        id: "project",
                        redirect: "@target"
                    },
                    {
                        id: "target",
                        domain: "target.domain",
                        page_title: "Target Page Title",
                        title: "Target Title",
                        subtitle: "Target Subtitle"
                    },
                ];

                fs.writeFileSync(path.resolve(datadir, "project.json"), JSON.stringify(projects[0], null, 4));
                fs.writeFileSync(path.resolve(datadir, "target.json"), JSON.stringify(projects[1], null, 4));

                assert.deepStrictEqual(DataLoader.getProjects(), projects);
            });

            it("external redirect target", function()
            {
                let projects = [
                    {
                        id: "project",
                        redirect: "https://github.com/ghifari160/splash"
                    }
                ];

                fs.writeFileSync(path.resolve(datadir, "project.json"), JSON.stringify(projects[0], null, 4));

                assert.deepStrictEqual(DataLoader.getProjects(), projects);
            });
        });

        describe("invalid project", function()
        {
            it("missing project ID", function()
            {
                let projects = [
                    {
                        domain: "project",
                        page_title: "Project Page Title",
                        title: "Project Title",
                        subtitle: "Project Subtitle"
                    }
                ];
                fs.writeFileSync(path.resolve(datadir, "project.json"), JSON.stringify(projects[0], null, 4));

                assert.deepStrictEqual(DataLoader.getProjects(), []);
            });

            it("empty project ID", function()
            {
                let projects = [
                    {
                        id: "",
                        domain: "project",
                        page_title: "Project Page Title",
                        title: "Project Title",
                        subtitle: "Project Subtitle"
                    }
                ];
                fs.writeFileSync(path.resolve(datadir, "project.json"), JSON.stringify(projects[0], null, 4));

                assert.deepStrictEqual(DataLoader.getProjects(), []);
            });

            it("invalid internal redirect target", function()
            {
                let projects = [
                    {
                        id: "project",
                        domain: "project",
                        redirect: "@invalid"
                    }
                ];
                fs.writeFileSync(path.resolve(datadir, "project.json"), JSON.stringify(projects[0], null, 4));

                assert.deepStrictEqual(DataLoader.getProjects(), []);
            });
        });
    });
});

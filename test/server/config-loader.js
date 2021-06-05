const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { validate: uuidValidate, version: uuidVersion } = require("uuid");

const current_version = "0.4.0";

const configLoc = path.resolve(__dirname, "../../config.json");
const configLoc_legacy = path.resolve(__dirname, "../../data/config.json");

describe("config-loader", function()
{
    let Core;
    let ConfigLoader;

    before(function()
    {
        if(fs.existsSync(configLoc_legacy))
            fs.renameSync(configLoc_legacy, `${configLoc_legacy}.old`);

        if(fs.existsSync(configLoc))
            fs.renameSync(configLoc, `${configLoc}.old`);
    });

    after(function()
    {
        if(fs.existsSync(`${configLoc_legacy}.old`))
            fs.renameSync(`${configLoc_legacy}.old`, configLoc_legacy);

        if(fs.existsSync(`${configLoc}.old`))
            fs.renameSync(`${configLoc}.old`, configLoc);
    });

    beforeEach(function()
    {
        Core = require("../../src/server/core");
        Core.logger = { log: function() {} };

        ConfigLoader = require("../../src/server/config-loader");
    });

    afterEach(function()
    {
        if(fs.existsSync(configLoc_legacy))
            fs.unlinkSync(configLoc_legacy);

        if(fs.existsSync(configLoc))
            fs.unlinkSync(configLoc);
    });

    describe("#getConfig()", function()
    {
        describe("version", function()
        {
            it("creates default object", function()
            {
                let conf =
                {
                    instance: { id: "/dev/test" },
                    server:
                    {
                        listen_port: "8080",
                        public_port: "8080"
                    }
                }

                fs.writeFileSync(configLoc, JSON.stringify(conf, null, 4));

                conf.version = current_version;

                assert.deepStrictEqual(ConfigLoader.getConfig(), conf);
            });

            it("upgrades version", function()
            {
                let conf =
                {
                    version: "0.1.0",
                    instance: { id: "/dev/test" },
                    server:
                    {
                        listen_port: "8080",
                        public_port: "8080"
                    }
                };

                fs.writeFileSync(configLoc, JSON.stringify(conf, null, 4));

                conf.version = current_version;

                assert.deepStrictEqual(ConfigLoader.getConfig(), conf);
            });
        });

        describe("server", function()
        {
            it("creates default object", function()
            {
                let conf =
                {
                    version: current_version,
                    instance: { id: "/dev/test" }
                };

                fs.writeFileSync(configLoc, JSON.stringify(conf, null, 4));

                conf.server =
                {
                    listen_port: "8080",
                    public_port: "8080"
                };

                assert.deepStrictEqual(ConfigLoader.getConfig(), conf);
            });

            it("listen_port from port", function()
            {
                let conf =
                {
                    version: current_version,
                    instance: { id: "/dev/test" },
                    server: { port: "8080" }
                };

                fs.writeFileSync(configLoc, JSON.stringify(conf, null, 4));

                conf.server.listen_port = conf.server.port;
                conf.server.public_port = conf.server.port;

                assert.deepStrictEqual(ConfigLoader.getConfig(), conf);
            });

            it("public_port from listen_port", function()
            {
                let conf =
                {
                    version: current_version,
                    instance: { id: "/dev/test" },
                    server: { listen_port: 8080 }
                };

                fs.writeFileSync(configLoc, JSON.stringify(conf, null, 4));

                conf.server.public_port = conf.server.listen_port;

                assert.deepStrictEqual(ConfigLoader.getConfig(), conf);
            });
        });

        describe("instance:", function()
        {
            it("create default object", function()
            {
                let conf =
                {
                    version: current_version,
                    server:
                    {
                        listen_port: "8080",
                        public_port: "8080"
                    }
                };

                fs.writeFileSync(configLoc, JSON.stringify(conf, null, 4));

                let actual = ConfigLoader.getConfig();

                assert.ok(actual.hasOwnProperty("instance"), "config.instance is missing");
                assert.ok(actual.instance.hasOwnProperty("id"), "config.instance.id is missing");
                assert.ok(uuidValidate(actual.instance.id), "config.instance.id is not a valid UUID");
                assert.strictEqual(uuidVersion(actual.instance.id), 4, "config.instance.id is not a valid UUIDv4")

                delete actual.instance;

                assert.deepStrictEqual(actual, conf, "The rest of config does not match the expected value");
            });

            it("generate instance ID from UUIDv4 if not present", function()
            {
                let conf =
                {
                    version: current_version,
                    instance: {},
                    server:
                    {
                        listen_port: "8080",
                        public_port: "8080"
                    }
                };

                fs.writeFileSync(configLoc, JSON.stringify(conf, null, 4));

                let actual = ConfigLoader.getConfig();

                assert.ok(actual.hasOwnProperty("instance"), "config.instance is missing");
                assert.ok(actual.instance.hasOwnProperty("id"), "config.instance.id is missing");
                assert.ok(uuidValidate(actual.instance.id), "config.instance.id is not a valid UUID");
                assert.strictEqual(uuidVersion(actual.instance.id), 4, "config.instance.id is not a valid UUIDv4");

                delete conf.instance;
                delete actual.instance;

                assert.deepStrictEqual(actual, conf, "The rest of config does not match the expected value");
            });

            it("preserve empty string instance ID", function()
            {
                let conf =
                {
                    version: current_version,
                    instance: { id: "" },
                    server:
                    {
                        listen_port: "8080",
                        public_port: "8080"
                    }
                };

                fs.writeFileSync(configLoc, JSON.stringify(conf, null, 4));

                let actual = ConfigLoader.getConfig();

                assert.ok(actual.hasOwnProperty("instance"), "config.instance is missing");
                assert.ok(actual.instance.hasOwnProperty("id"), "config.instance.id is missing");
                assert.deepStrictEqual(actual.instance.id, conf.instance.id, "config.instance.id does not match the expected value");

                delete conf.instance;
                delete actual.instance;

                assert.deepStrictEqual(actual, conf, "The rest of config does not match the expetected value");
            });

            it("read instance ID from SPLASH_INSTANCE_ID environment variable", function()
            {
                let env_bak;

                if(typeof process.env.SPLASH_INSTANCE_ID !== "undefined")
                    env_bak = process.env.SPLASH_INSTANCE_ID;

                process.env.SPLASH_INSTANCE_ID = "/dev/test";

                let conf =
                {
                    version: current_version,
                    server:
                    {
                        listen_port: "8080",
                        public_port: "8080"
                    }
                };

                fs.writeFileSync(configLoc, JSON.stringify(conf, null, 4));

                let actual = ConfigLoader.getConfig();

                assert.ok(actual.hasOwnProperty("instance"), "config.instance is missing");
                assert.ok(actual.instance.hasOwnProperty("id"), "config.instance.id is missing");
                assert.strictEqual(actual.instance.id, "/dev/test", "config.instance.id does not match the expected value");

                delete actual.instance;

                assert.deepStrictEqual(actual, conf, "The rest of config does not match the expected value");

                if(typeof env_bak !== "undefined")
                    process.env.SPLASH_INSTANCE_ID = env_bak;
                else
                    delete process.env.SPLASH_INSTANCE_ID;
            });
        });

        describe("config", function()
        {
            it("generate default config.json", function()
            {
                let conf =
                {
                    version: current_version,
                    server:
                    {
                        listen_port: "8080",
                        public_port: "8080"
                    }
                };

                let actual = ConfigLoader.getConfig();

                assert.ok(actual.hasOwnProperty("instance"), "config.instance is missing");
                assert.ok(actual.instance.hasOwnProperty("id"), "config.instance.id is missing");
                assert.ok(uuidValidate(actual.instance.id), "config.instance.id is not a valid UUID");
                assert.strictEqual(uuidVersion(actual.instance.id), 4, "config.instance.id is not a valid UUIDv4");

                delete actual.instance;

                assert.deepStrictEqual(actual, conf, "The generated config does not match the expected value");
            });

            let loc1 = path.relative(path.resolve(__dirname, ".."), configLoc_legacy);
            let loc2 = path.relative(path.resolve(__dirname, ".."), configLoc);
            it(`move ${loc1} to ${loc2}`, function()
            {
                let conf =
                {
                    version: current_version,
                    instance: { id: "/dev/test" },
                    server:
                    {
                        listen_port: "8080",
                        public_port: "8080"
                    }
                };

                fs.writeFileSync(configLoc_legacy, JSON.stringify(conf, null, 4));

                assert.deepStrictEqual(ConfigLoader.getConfig(), conf);
            });
        });
    });
});

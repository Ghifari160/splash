const fs = require("fs");
const path = require("path");
const http = require("http");

const assert = require("assert");

function get(opts, expectedStatusCode = 200)
{
    let ret =  new Promise(function(resolve, reject)
    {
        let req = http.request(opts, (res) =>
        {
            let data = "";

            if(res.statusCode != expectedStatusCode)
            {
                reject("Status code does not match expected value.");
            }

            res.on("error", (err) =>
            {
                reject(err);
            });

            res.on("data", (chunk) =>
            {
                data += chunk;
            });

            res.on("close", () =>
            {
                resolve(data);
            });
        });

        req.on("error", (err) =>
        {
            reject(err);
        });

        req.end();
    });

    return ret;
}

describe("Live test", function()
{
    describe("Test response status codes", function()
    {
        let url = "localhost";
        let port = "8080";
        let path = "/";

        let opts =
        {
            host: url,
            port: port,
            path: path,
            method: "GET",
        };

        it("Return 200 status", function()
        {
            this.timeout(3000);

            return get(opts);
        });

        it("Return 404 status", function()
        {
            this.timeout(3000);

            let opt = {};
            Object.assign(opt, opts);

            opt.path = "/error";

            return get(opt, 404);
        });
    });
});

const http = require("http");
const https = require("https");

function serverRequest(options) {
    return new Promise((resolve, reject) => {

        if (options.body) {
            options.body = JSON.stringify(options.body);
            options.headers["Content-Length"] = Buffer.byteLength(options.body);
        }

        options.rejectUnauthorized = false;

        var prot = options.port == 443 ? https : http;
        var req = prot.request(options, function(res)
        {
            var output = '';
            res.setEncoding('utf8');

            res.on('data', function (chunk) {
                output += chunk;
            });

            res.on('end', function() {
                var obj = output !== "" ? JSON.parse(output) : null;
                resolve({ status: res.statusCode, data: obj });
            });
        });

        req.on('error', function(err) {
            reject(err.message);
        });

        if (options.body)
            req.end(options.body);
        else
            req.end();
    });
}

module.exports = serverRequest;

const http = require("http");

http.createServer((req, res) => {
    let body = [];
    req.on("data", chunk => {
        body.push(chunk);
    }).on("end", () => {
        body = Buffer.concat(body).toString();
        console.log(body);
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end("okay");
    });
}).listen(80);

const express = require("express");
const bodyParser = require('body-parser');
const app = express();

const port = process.env.PORT || 80;
const ip   = process.env.IP || '0.0.0.0';

let lastRequest = null;

app.use(bodyParser.json());

app.get("/", function(req, res) {
    res.json(lastRequest);
    lastRequest = null;
});

app.post("/", function(req, res) {
    lastRequest = req.body;
    res.json({});
});

console.log("Will listen on port " + port + " and ip " + ip);

app.listen(port, ip, () => {
    console.log("aApp started listening on port " + port + " and ip " + ip);
});

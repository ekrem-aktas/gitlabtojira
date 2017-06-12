const express = require("express");
const bodyParser = require('body-parser');
const app = express();

const port = process.env.PORT || 80;
const ip   = /*process.env.IP ||*/ '0.0.0.0';

app.use(bodyParser.json());

app.get("/", function(req, res) {
    res.send("okay!!");
});

app.post("/", function(req, res) {
    const mergeRequest = req.body;
    res.json(mergeRequest);
});

console.log("Will listen on port " + port + " and ip " + ip);

app.listen(port, ip, () => {
    console.log("aApp started listening on port " + port + " and ip " + ip);
});

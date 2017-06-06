const express = require("express");
const app = express();

const port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 80;
const ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';

app.get("/", function(req, res) {
    res.send("okay");
});

console.log("Will listen on port " + port + " and ip " + ip);

app.listen(port, ip, () => {
    console.log("App started listening on port " + port + " and ip " + ip);
});

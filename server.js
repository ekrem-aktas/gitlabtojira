const express = require("express");
const app = express();

const port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080;
const ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';

app.get("/test", function(req, res) {
    res.send("okay");
});

app.listen(port, ip, () => {
    console.log("App started listening on port " + port + " and ip " + ip);
});

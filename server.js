const express = require("express");
const app = express();

const port = process.env.PORT || 80;
const ip   = /*process.env.IP ||*/ '0.0.0.0';

app.get("/", function(req, res) {
    res.send("okay");
});

console.log("Will listen on port " + port + " and ip " + ip);

app.listen(port, ip, () => {
    console.log("aApp started listening on port " + port + " and ip " + ip);
});

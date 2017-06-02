const express = require("express");
const app = express();

app.get("/", function(req, res) {
    res.send("okay");
});

app.listen(80, () => {
    console.log("App started listening");
});

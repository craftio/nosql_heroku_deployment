let express = require('express');
let server  = express.Router();

server.use("/", (req, res, next) => {
    res.contentType("application/json");
    next();
});

server.get("/", (req, res) => {
    res.status(200);
    res.send("test friendship routes v1");
});

// Get all friendships
server.get("/friendships", (req, res) => {
    console.log("GET /api/friendships");
    res.status(200);
    res.json({
        'statuscode': 200,
        'message': 'get all friendships'
    })
});

module.exports = (server);

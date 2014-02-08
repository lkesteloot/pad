// Copyright 2014 Lawrence Kesteloot

"use strict";

var net = require("net");

var gTracing = true;
var gServer = null;
var gConnection = null;
var gLines = [];

var startServer = function () {
    if (gServer === null) {
        gServer = net.createServer(function (connection) {
            gConnection = connection;
            connection.on("end", function() {
                gConnection = null;
            });
            gLines.forEach(function (line) {
                connection.write(line);
            });
            gLines = [];
        });
        gServer.listen(8124);
    }
};

exports.stopServer = function () {
    if (gConnection !== null) {
        gConnection.end();
        gConnection = null;
    }

    if (gServer !== null) {
        gServer.close();
        gServer = null;
    }
};

exports.log = function (line) {
    if (gTracing) {
        startServer();

        line = line + "\n";

        if (gConnection === null) {
            gLines.push(line);
        } else {
            gConnection.write(line);
        }
    }
};

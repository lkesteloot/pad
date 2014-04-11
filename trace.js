// Copyright 2014 Lawrence Kesteloot

"use strict";

var util = require("util");
var net = require("net");

var PORT = 8124;

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
        gServer.listen(PORT);
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

exports.dir = function (obj) {
    exports.log(util.inspect(obj, { depth: null }));
};

exports.monitor = function () {
    var tryConnection = function () {
        var client = net.connect(PORT, function () {
            process.stdout.write("------------------------------------------------------------\n");
        });
        client.on("data", function (data) {
            process.stdout.write(data.toString());
        });
        client.on("end", function (data) {
            process.stdout.write("--- Disconnected ---\r");
            setTimeout(tryConnection, 1000);
        });
        client.on("error", function (data) {
            setTimeout(tryConnection, 1000);
        });
    };
    tryConnection();
};

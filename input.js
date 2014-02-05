// Copyright 2014 Lawrence Kesteloot

var util = require("util");
var trace = require("./trace");

exports.start = function () {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("data", onData);
};

exports.stop = function () {
    process.stdin.removeListener("data", onData);
    process.stdin.pause();
    process.stdin.setRawMode(false);
};

require("./window").Window.events.on("shutdown", exports.stop);

// data is a Node Buffer object.
var onData = function (data) {
    trace.log("Got input: " + util.inspect(data));

    for (var i = 0; i < data.length; i++) {
        if (data[i] == 113) {
            // "q"
            require("./window").Window.events.emit("shutdown");
        }
        // process.stdout.write(" " + data[i]);
    }
};

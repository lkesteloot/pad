// Copyright 2014 Lawrence Kesteloot

"use strict";

var util = require("util");
var events = require("events");
var trace = require("./trace");

exports.events = new events.EventEmitter();

exports.start = function () {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("data", onData);
    require("./window").events.on("shutdown", exports.stop);
};

exports.stop = function () {
    process.stdin.removeListener("data", onData);
    process.stdin.pause();
    process.stdin.setRawMode(false);
    require("./window").events.removeListener("shutdown", exports.stop);
};

// data is a Node Buffer object.
var onData = function (data) {
    trace.log("Got input: " + util.inspect(data));

    for (var i = 0; i < data.length; i++) {
        exports.events.emit("key", data[i]);
    }
};

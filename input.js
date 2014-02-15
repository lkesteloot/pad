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
};

exports.stop = function () {
    process.stdin.removeListener("data", onData);
    process.stdin.pause();
    process.stdin.setRawMode(false);
};

// data is a Node Buffer object.
var onData = function (data) {
    trace.log("Got input: " + util.inspect(data));
    exports.events.emit("key", data.toString());
};

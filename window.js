// Copyright 2014 Lawrence Kesteloot

"use strict";

var events = require("events");
var Pane = require("./pane");
var input = require("./input");
var trace = require("./trace");
var term = require("./term");

var Window = function () {
    // Singleton.
    Window.instance = this;

    this.width = -1;
    this.height = -1;
    this.panes = [];
    this.events = new events.EventEmitter();

    process.stdout.on("resize", this.onResize.bind(this));
    this.updateScreenSize();

    this.panes.push(new Pane(0, 0, this.width, this.height)); //Math.floor(this.height/4)));

    input.events.on("key", this.onKey.bind(this));

    this.events.on("shutdown", function () {
        // This doesn't work. The cursor doesn't move. Maybe it's not being flushed and
        // we need to wait for the "drain" event. No that's not the problem, it's returning
        // true.
        var flushed = term.moveTo(0, this.height - 1);
        input.stop();
        trace.stopServer();
    }.bind(this));
};

Window.prototype.updateScreenSize = function () {
    var width = process.stdout.columns;
    var height = process.stdout.rows;

    if (height !== this.height || width !== this.width) {
        this.height = height;
        this.width = width;
        trace.log("Window size is now " + width + "x" + height);

        this.panes.forEach(function (pane) {
            pane.resize(width, height);
        });
    }
};

Window.prototype.onResize = function () {
    this.updateScreenSize();
};

Window.prototype.onKey = function (key) {
    this.panes[0].onKey(key);
};

module.exports = Window;

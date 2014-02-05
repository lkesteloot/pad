// Copyright 2014 Lawrence Kesteloot

var events = require("events");
var Pane = require("./pane");
var input = require("./input");
var trace = require("./trace");

var Window = function () {
    this.width = -1;
    this.height = -1;
    this.panes = [];

    process.stdout.on("resize", onResize.bind(this));
    this.updateScreenSize();

    this.panes.push(new Pane(0, 0, this.width, this.height)); //Math.floor(this.height/4)));

    input.events.on("key", onKey.bind(this));
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

var onResize = function () {
    this.updateScreenSize();
};

var onKey = function (key) {
    if (key == 113) {
        // "q"
        Window.events.emit("shutdown");
    } else {
        this.panes[0].onKey(key);
    }
};

Window.events = new events.EventEmitter();
Window.events.on("shutdown", function () {
    // Nothing.
});
Window.events.on("key", function (key) {
    // Nothing.
});

module.exports = Window;

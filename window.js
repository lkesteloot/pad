// Copyright 2014 Lawrence Kesteloot

var events = require("events");
var Pane = require("./pane.js").Pane;

exports.Window = function () {
    this.width = -1;
    this.height = -1;
    this.panes = [];

    process.stdout.on("resize", onResize.bind(this));
    this.updateScreenSize();

    this.panes.push(new Pane(0, 0, this.width, this.height));
};

exports.Window.prototype.updateScreenSize = function () {
    var width = process.stdout.columns;
    var height = process.stdout.rows;

    if (height !== this.height || width !== this.width) {
        this.height = height;
        this.width = width;

        this.panes.forEach(function (pane) {
            pane.resize(width, height);
        });
    }
};

exports.Window.events = new events.EventEmitter();
exports.Window.events.on("shutdown", function () {
    console.log("Shutting DOWN!");
});

var onResize = function () {
    this.updateScreenSize();
};

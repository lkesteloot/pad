// Copyright 2014 Lawrence Kesteloot

"use strict";

var events = require("events");
var Pane = require("./pane");
var input = require("./input");
var trace = require("./trace");
var term = require("./term");

var Window = function () {
    this.width = -1;
    this.height = -1;
    this.panes = [];
    this.activePane = 0;
    this.events = new events.EventEmitter();

    process.stdout.on("resize", this.onResize.bind(this));
    this.updateScreenSize();

    var half = Math.floor(this.height/2);
    this.panes.push(new Pane(this, 0, 0, this.width, half));
    this.panes.push(new Pane(this, 0, half, this.width, this.height - 1 - half));
    this.panes[this.activePane].setFocus(true);

    input.events.on("key", this.onKey.bind(this));
};

Window.prototype.shutdown = function () {
    term.moveTo(0, this.height - 1);
    input.stop();
    trace.stopServer();
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
    this.panes[this.activePane].onKey(key);
};

Window.prototype.nextPane = function () {
    if (this.panes.length > 0) {
        this.panes[this.activePane].setFocus(false);
        this.activePane = (this.activePane + 1) % this.panes.length;
        this.panes[this.activePane].setFocus(true);
    }
};

module.exports = Window;

/*

        term.moveTo(this.x, this.contentHeight + 1);
        term.clearChars(this.width);
        term.moveTo(this.x, this.contentHeight + 2);
        term.clearChars(this.width);
        */

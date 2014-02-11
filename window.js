// Copyright 2014 Lawrence Kesteloot

"use strict";

var Pane = require("./pane");
var CommandPane = require("./command_pane");
var input = require("./input");
var trace = require("./trace");
var term = require("./term");

var Window = function () {
    this.width = -1;
    this.height = -1;
    this.panes = [];
    this.activePane = 0;

    process.stdout.on("resize", this.onResize.bind(this));
    this.updateScreenSize();

    var half = Math.floor(this.height/2);
    this.panes.push(new Pane(this, 0, 0, this.width, half));
    this.panes.push(new Pane(this, 0, half, this.width, this.height - 1 - half));
    this.getActivePane().setFocus(true);

    this.commandPane = new CommandPane(this, 0, this.height - 1, this.width);
    this.commandPaneActive = false;

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
    if (this.commandPaneActive) {
        this.commandPane.onKey(key);
    } else {
        this.getActivePane().onKey(key);
    }
};

/**
 * Returns the active Pane object. This still points to an editable pane,
 * even if the command pane has focus.
 */
Window.prototype.getActivePane = function () {
    return this.panes[this.activePane];
};

Window.prototype.nextPane = function () {
    if (this.panes.length > 0) {
        this.getActivePane().setFocus(false);
        this.activePane = (this.activePane + 1) % this.panes.length;
        this.getActivePane().setFocus(true);
    }
};

Window.prototype.activateCommandPane = function () {
    this.getActivePane().setFocus(false);
    this.commandPaneActive = true;
    this.commandPane.setFocus(true);
};

Window.prototype.deactivateCommandPane = function () {
    this.commandPane.setFocus(false);
    this.commandPaneActive = false;
    this.getActivePane().setFocus(true);
};

module.exports = Window;

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

    if (false) {
        var half = Math.floor(this.height/2);
        this.panes.push(new Pane(this, 0, 0, this.width, half));
        this.panes.push(new Pane(this, 0, half, this.width, this.height - 1 - half));
    } else {
        this.panes.push(new Pane(this, 0, 0, this.width, this.height - 1));
    }
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
            // XXX Must actually lay out all panes:
            /// pane.resize(width, height);
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

Window.prototype.setActivePaneNumber = function (paneNumber) {
    this.getActivePane().setFocus(false);
    this.activePane = paneNumber;
    this.getActivePane().setFocus(true);
};

Window.prototype.setActivePane = function (pane) {
    var newPaneNumber;

    for (var i = 0; i < this.panes.length; i++) {
        if (this.panes[i] === pane) {
            newPaneNumber = i;
            break;
        }
    }

    if (newPaneNumber === undefined) {
        throw new Error("can't find pane by reference");
    }

    this.setActivePaneNumber(newPaneNumber);
};

Window.prototype.nextPane = function () {
    if (this.panes.length > 0) {
        this.setActivePaneNumber((this.activePane + 1) % this.panes.length);
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

/**
 * Splits the given pane in half vertically, creating a new empty pane on the right
 * and returning it.
 */
Window.prototype.splitVertically = function (pane, paneConstructor) {
    if (!paneConstructor) {
        paneConstructor = Pane;
    }

    var half = Math.floor(pane.width/2);
    var newPane = new paneConstructor(this, pane.x + half, pane.y, pane.width - half, pane.height);
    pane.setWidth(half);

    this.panes.push(newPane);

    return newPane;
};

module.exports = Window;

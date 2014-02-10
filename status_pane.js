// Copyright 2014 Lawrence Kesteloot

"use strict";

var util = require("util");
var Pane = require("./pane");
var StatusKeys = require("./status_keys");
var StatusFormatter = require("./status_formatter");

// Subclass of Pane.
var StatusPane = function (window, x, y, width) {
    Pane.call(this, window, x, y, width, 1);

    this.contentHeight = 1;
    this.keys = new StatusKeys();
};
util.inherits(StatusPane, Pane);

StatusPane.prototype.hasStatusLine = function () {
    return false;
};

StatusPane.prototype.getFormatter = function () {
    return new StatusFormatter(this.width);
};

module.exports = StatusPane;

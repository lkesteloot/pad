// Copyright 2014 Lawrence Kesteloot

"use strict";

var util = require("util");
var Pane = require("./pane");
var StatusKeys = require("./status_keys");

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

module.exports = StatusPane;

// Copyright 2014 Lawrence Kesteloot

"use strict";

var util = require("util");
var Pane = require("./pane");
var CommandKeys = require("./command_keys");
var CommandFormatter = require("./command_formatter");

// Subclass of Pane.
var CommandPane = function (window, x, y, width) {
    Pane.call(this, window, x, y, width, 1);

    this.contentHeight = 1;
    this.keys = new CommandKeys();
};
util.inherits(CommandPane, Pane);

CommandPane.prototype.hasStatusLine = function () {
    return false;
};

CommandPane.prototype.getFormatter = function () {
    return new CommandFormatter(this.width, this.hasFocus);
};

CommandPane.prototype.setFocus = function (hasFocus) {
    Pane.prototype.setFocus.call(this, hasFocus);
    this.layoutDirty = true;
    setTimeout(this.sanitizeAndRefresh.bind(this), 0);
};

module.exports = CommandPane;

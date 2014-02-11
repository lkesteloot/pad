// Copyright 2014 Lawrence Kesteloot

"use strict";

var util = require("util");
var ViKeys = require("./vi_keys");

var CommandKeys = function () {
    ViKeys.call(this);
    this.setMode(ViKeys.MODE_INSERT);
};
util.inherits(CommandKeys, ViKeys);

CommandKeys.prototype.handleInsertKey = function (key, pane, callback) {
    if (key === 10 || key === 13) {
        // Submit command.
        pane.submitCommand(callback);
    } else {
        ViKeys.prototype.handleInsertKey.call(this, key, pane, callback);
    }
};

module.exports = CommandKeys;

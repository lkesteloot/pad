// Copyright 2014 Lawrence Kesteloot

"use strict";

var util = require("util");
var ViKeys = require("./vi_keys");
var trace = require("./trace");

var SearchKeys = function () {
    ViKeys.call(this);
    this.setMode(ViKeys.MODE_INSERT);
};
util.inherits(SearchKeys, ViKeys);

SearchKeys.prototype.handleInsertKey = function (key, pane, callback) {
    if (key === "\r" || key === "\n") {
        // Submit command.
        // pane.submitCommand(callback);
    } else {
        ViKeys.prototype.handleInsertKey.call(this, key, pane, callback);
    }
};

module.exports = SearchKeys;

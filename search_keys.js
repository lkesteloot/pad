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
    switch (key) {
        case "\x0E": // ^N
        case "\x1B[B": // Down arrow.
            pane.selected++;
            pane.layoutDirty = true;
            break;

        case "\x10": // ^P
        case "\x1B[A": // Up arrow.
            pane.selected--;
            pane.layoutDirty = true;
            break;

        default:
            ViKeys.prototype.handleInsertKey.call(this, key, pane, callback);
            return;
    }

    process.nextTick(callback);
};

module.exports = SearchKeys;

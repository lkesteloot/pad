// Copyright 2014 Lawrence Kesteloot

"use strict";

var util = require("util");
var AbstractKeys = require("./abstract_keys");

var FileTreeKeys = function () {
    AbstractKeys.call(this);
};
util.inherits(FileTreeKeys, AbstractKeys);

FileTreeKeys.prototype.onKey = function (key, pane, callback) {
    switch (key) {
        case "\n":
        case "\r":
            // Open file.
            var filename = pane.getCurrentLine();
            pane.originalPane.loadFile(filename, function () {
                // Close this pane.
                pane.window.setActivePane(pane.originalPane);
            }.bind(this));
            break;

        case "\x0E": // ^N
        case "\x1B[B": // Down arrow.
            pane.cursorY++;
            break;

        case "\x10": // ^P
        case "\x1B[A": // Up arrow.
            pane.cursorY--;
            break;

        case ":":
        case ";":
            pane.window.activateCommandPane();
            break;
    }

    process.nextTick(callback);
};

module.exports = FileTreeKeys;

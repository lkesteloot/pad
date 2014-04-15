// Copyright 2014 Lawrence Kesteloot

"use strict";

var util = require("util");
var AbstractKeys = require("./abstract_keys");

var FileTreeKeys = function () {
    AbstractKeys.call(this);
};
util.inherits(FileTreeKeys, AbstractKeys);

FileTreeKeys.prototype.getState = function (pane) {
    return pane.searchText;
};

FileTreeKeys.prototype.onKey = function (key, pane, callback) {
    switch (key) {
        case "\n":
        case "\r":
            // Open file.
            pane.openFile();
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

        case "\x08": // Backspace
        case "\x7F": // Delete
            if (pane.searchText.length > 0) {
                pane.setSearchText(pane.searchText.substring(0, pane.searchText.length - 1));
            }
            break;

        case "/":
            pane.completeDirectory();
            break;

        default:
            if (isFilenameKey(key)) {
                pane.setSearchText(pane.searchText + key);
            }
            break;
    }

    process.nextTick(callback);
};

var isFilenameKey = function (key) {
    return key >= " " && key < "\x7F" && key != "/" && key != "\\" &&
        key != ":" && key != ";" && key != "*" && key != "?";
};

module.exports = FileTreeKeys;

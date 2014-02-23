// Copyright 2014 Lawrence Kesteloot

"use strict";

var util = require("util");
var AbstractKeys = require("./abstract_keys");

var FileTreeKeys = function () {
    AbstractKeys.call(this);
    this.searchText = "";
};
util.inherits(FileTreeKeys, AbstractKeys);

FileTreeKeys.prototype.getState = function () {
    return this.searchText;
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
            if (this.searchText.length > 0) {
                this.searchText = this.searchText.substring(0, this.searchText.length - 1);
                pane.setSearchText(this.searchText);
            }
            break;

        default:
            if (this.isFilenameKey(key)) {
                this.searchText += key;
                pane.setSearchText(this.searchText);
            }
            break;
    }

    process.nextTick(callback);
};

FileTreeKeys.prototype.isFilenameKey = function (key) {
    return key >= " " && key < "\x7F" && key != "/" && key != "\\" &&
        key != ":" && key != ";" && key != "*" && key != "?";
};

module.exports = FileTreeKeys;

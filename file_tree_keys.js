// Copyright 2014 Lawrence Kesteloot

"use strict";

var util = require("util");
var AbstractKeys = require("./abstract_keys");
var strings = require("./strings");

var FileTreeKeys = function () {
    AbstractKeys.call(this);
    this.search = "";
};
util.inherits(FileTreeKeys, AbstractKeys);

FileTreeKeys.prototype.getState = function () {
    return this.search;
};

FileTreeKeys.prototype.onKey = function (key, pane, callback) {
    switch (key) {
        case "\n":
        case "\r":
            // Open file.
            var filename = pane.getCurrentLine();
            pane.mainPane.loadFile(filename, function () {
                // Close this pane.
                pane.mainPane.closeRightPane();
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

        case "\x08": // Backspace
        case "\x7F": // Delete
            if (this.search.length > 0) {
                this.search = this.search.substring(0, this.search.length - 1);
                this.updateSearch(pane);
            }
            break;

        default:
            if (this.isFilenameKey(key)) {
                this.search += key;
                this.updateSearch(pane);
            }
            break;
    }

    process.nextTick(callback);
};

FileTreeKeys.prototype.isFilenameKey = function (key) {
    return key >= " " && key < "\x7F" && key != "/" && key != "\\" &&
        key != ":" && key != ";" && key != "*" && key != "?";
};

FileTreeKeys.prototype.updateSearch = function (pane) {
    // Update status line.
    pane.redrawDirty = true;

    // Find the line that starts with the search prefix.
    var docIndex = 0;
    while (true) {
        var nextDocIndex = pane.doc.findNextLine(docIndex);
        if (nextDocIndex === docIndex) {
            break;
        }

        var text = pane.doc.toString(docIndex, nextDocIndex);
        if (strings.startsWith(text, this.search)) {
            pane.desiredDocIndex = docIndex;
            break;
        }

        docIndex = nextDocIndex;
    }
};

module.exports = FileTreeKeys;

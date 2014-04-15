// Copyright 2014 Lawrence Kesteloot

"use strict";

var util = require("util");
var fs = require("fs");
var path = require("path");
var Pane = require("./pane");
var FileTreeKeys = require("./file_tree_keys");
// var FileTreeFormatter = require("./command_formatter");
var trace = require("./trace");
var strings = require("./strings");
var Line = require("./line");
var Attr = require("./attr");
var Fragment = require("./fragment");
var Directory = require("./directory");

// Subclass of Pane.
var FileTreePane = function (window, x, y, width, height, mainPane) {
    Pane.call(this, window, x, y, width, height, mainPane);

    this.keys = new FileTreeKeys();
    this.searchText = "";
    this.layoutDirty = true;
    this.queueRedraw();
};
util.inherits(FileTreePane, Pane);

// Override.
FileTreePane.prototype.format = function () {
    var lines = [];

    var addDirectory = function (directory, indent) {
        var filenames = Object.keys(directory.entries);
        filenames.sort();

        filenames.forEach(function (filename) {
            var value = directory.entries[filename];

            var text = filename;
            if (value instanceof Directory) {
                text += "/";
            }

            if (indent + text.length > this.contentWidth) {
                // Might be clipped completely.
                text = text.substring(0, this.contentWidth - indent);
            }

            var line = new Line(text, indent, true, null);
            line.misc = {
                directory: directory,
                filename: filename,
            };
            lines.push(line);

            if (value instanceof Directory && value.isOpen) {
                addDirectory(value, indent + 4);
            }
        }.bind(this));
    }.bind(this);

    addDirectory(this.window.directory, 0);
    this.layout.lines = lines;
};

FileTreePane.prototype.openFile = function () {
    var line = this.layout.lines[this.cursorY];
    var directory = line.misc.directory;
    var filename = line.misc.filename;
    var pathname = path.join(directory.pathname, filename);
    var value = directory.entries[filename];

    if (value instanceof Directory) {
        value.isOpen = !value.isOpen;
        this.setSearchText("");
        this.layoutDirty = true;
        this.queueRedraw();
    } else {
        this.mainPane.loadFile(pathname, function () {
            // Close this pane.
            this.mainPane.closeRightPane();
        }.bind(this));
    }
};

FileTreePane.prototype.setSearchText = function (searchText) {
    this.searchText = searchText;

    // Update status line.
    this.redrawDirty = true;

    this.updateSearchHighlight();
};

FileTreePane.prototype.updateSearchHighlight = function () {
    // Find the line that starts with the search prefix.
    var first = true;
    for (var i = 0; i < this.layout.lines.length; i++) {
        var line = this.layout.lines[i];
        var filename = line.misc.filename;
        line.clearFragments(Line.SEARCH_CATEGORY);

        if (this.searchText !== "" && strings.startsWith(filename, this.searchText)) {
            line.addFragment(Line.SEARCH_CATEGORY,
                             new Fragment(0, this.searchText.length, Attr.HIGHLIGHT));

            if (first) {
                this.cursorY = i;
                first = false;
            }
        }
    }
};

// If the cursor is sitting on a line that's a directory, then
// open the directory (if not already open) and reset the search
// string. This doesn't work so well because the next search
// isn't scoped to this directory. We could show only this directory
// (at the top level) or dim the other directories. In either case not
// sure how to get back up one directory.
FileTreePane.prototype.completeDirectory = function () {
    var line = this.layout.lines[this.cursorY];
    var directory = line.misc.directory;
    var filename = line.misc.filename;
    var pathname = path.join(directory.pathname, filename);
    var value = directory.entries[filename];

    if (value instanceof Directory) {
        value.isOpen = true;
        this.setSearchText("");
        this.layoutDirty = true;
        this.queueRedraw();
    }
};

module.exports = FileTreePane;

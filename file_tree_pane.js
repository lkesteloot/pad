// Copyright 2014 Lawrence Kesteloot

"use strict";

var util = require("util");
var fs = require("fs");
var Pane = require("./pane");
var FileTreeKeys = require("./file_tree_keys");
// var FileTreeFormatter = require("./command_formatter");
var trace = require("./trace");
var strings = require("./strings");
var Line = require("./line");
var Attr = require("./attr");
var Fragment = require("./fragment");

// Subclass of Pane.
var FileTreePane = function (window, x, y, width, height, mainPane) {
    Pane.call(this, window, x, y, width, height, mainPane);

    this.filenames = [".."];

    fs.readdir(".", function (err, files) {
        if (err) {
            trace.log("Error with readdir: " + err);
        } else {
            files.forEach(function (filename) {
                this.filenames.push(filename);
            }.bind(this));
        }
        this.layoutDirty = true;
        this.queueRedraw();
    }.bind(this));

    this.keys = new FileTreeKeys();
};
util.inherits(FileTreePane, Pane);

// Override.
FileTreePane.prototype.format = function () {
    var lines = [];

    this.filenames.forEach(function (filename) {
        lines.push(new Line(filename, 0, true, null));
    });

    this.layout.lines = lines;
};

FileTreePane.prototype.openFile = function () {
    var filename = this.filenames[this.cursorY];
    this.mainPane.loadFile(filename, function () {
        // Close this pane.
        this.mainPane.closeRightPane();
    }.bind(this));
};

FileTreePane.prototype.setSearchText = function (searchText) {
    // Update status line.
    this.redrawDirty = true;

    // Find the line that starts with the search prefix.
    var first = true;
    for (var i = 0; i < this.layout.lines.length; i++) {
        var line = this.layout.lines[i];
        line.clearFragments(Line.SEARCH_CATEGORY);

        if (searchText !== "" && strings.startsWith(line.text, searchText)) {
            line.addFragment(Line.SEARCH_CATEGORY,
                             new Fragment(0, searchText.length, Attr.HIGHLIGHT));

            if (first) {
                this.cursorY = i;
                first = false;
            }
        }
    }
};

module.exports = FileTreePane;

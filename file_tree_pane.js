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

    this.keys = new FileTreeKeys();
    this.updateFileList();
};
util.inherits(FileTreePane, Pane);

FileTreePane.prototype.updateFileList = function () {
    this.files = [];

    this.addFilename("..");

    fs.readdir(".", function (err, files) {
        if (err) {
            trace.log("Error with readdir: " + err);
        } else {
            files.forEach(function (filename) {
                this.addFilename(filename);
            }.bind(this));
        }
        this.layoutDirty = true;
        this.queueRedraw();
    }.bind(this));
};

FileTreePane.prototype.addFilename = function (filename) {
    var file = {
        filename: filename,
        stats: null
    };

    fs.stat(filename, function (err, stats) {
        if (err) {
            trace.log("Error with stat (" + filename + "): " + err);
        } else {
            file.stats = stats;
            this.layoutDirty = true;
            this.queueRedraw();
        }
    }.bind(this));

    this.files.push(file);
};

// Override.
FileTreePane.prototype.format = function () {
    var lines = [];

    this.files.forEach(function (file) {
        var text = file.filename;
        if (file.stats !== null) {
            if (file.stats.isDirectory()) {
                text += "/";
            }
        }

        lines.push(new Line(text, 0, true, null));
    });

    this.layout.lines = lines;
};

FileTreePane.prototype.openFile = function () {
    var file = this.files[this.cursorY];
    this.mainPane.loadFile(file.filename, function () {
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

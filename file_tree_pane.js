// Copyright 2014 Lawrence Kesteloot

"use strict";

var util = require("util");
var vm = require("vm");
var path = require("path");
var fs = require("fs");
var Pane = require("./pane");
var FileTreeKeys = require("./file_tree_keys");
// var FileTreeFormatter = require("./command_formatter");
var trace = require("./trace");

// Subclass of Pane.
var FileTreePane = function (window, x, y, width, height) {
    Pane.call(this, window, x, y, width, height);

    fs.readdir(".", function (err, files) {
        if (err) {
            trace.log("Error with readdir: " + err);
        } else {
            var docContents = "..\n";
            files.forEach(function (filename) {
                docContents += filename + "\n";
            });
            this.doc.setString(docContents);
        }
    }.bind(this));

    this.originalPane = null;
    this.keys = new FileTreeKeys();
};
util.inherits(FileTreePane, Pane);

FileTreePane.prototype.setOriginalPane = function (originalPane) {
    this.originalPane = originalPane;
};

/*
FileTreePane.prototype.getFormatter = function () {
    return new FileTreeFormatter(this.width, this.hasFocus, this.isMessage);
};
*/

module.exports = FileTreePane;

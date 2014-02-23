// Copyright 2014 Lawrence Kesteloot

"use strict";

var util = require("util");
var fs = require("fs");
var Pane = require("./pane");
var FileTreeKeys = require("./file_tree_keys");
// var FileTreeFormatter = require("./command_formatter");
var trace = require("./trace");

// Subclass of Pane.
var FileTreePane = function (window, x, y, width, height, mainPane) {
    Pane.call(this, window, x, y, width, height, mainPane);

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

    this.keys = new FileTreeKeys();
};
util.inherits(FileTreePane, Pane);

module.exports = FileTreePane;

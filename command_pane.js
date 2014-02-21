// Copyright 2014 Lawrence Kesteloot

"use strict";

var util = require("util");
var vm = require("vm");
var path = require("path");
var Pane = require("./pane");
var CommandKeys = require("./command_keys");
var CommandFormatter = require("./command_formatter");
var FileTreePane = require("./file_tree_pane");

// Subclass of Pane.
var CommandPane = function (window, x, y, width) {
    Pane.call(this, window, x, y, width, 1);

    this.isMessage = false;
    this.contentHeight = 1;
    this.keys = new CommandKeys();
};
util.inherits(CommandPane, Pane);

CommandPane.prototype.hasStatusLine = function () {
    return false;
};

// Override
CommandPane.prototype.format = function () {
    // XXX Just inline this class here.
    var formatter = new CommandFormatter(this.width, this.hasFocus, this.isMessage);
    formatter.format(this.doc, this.layout);
};

CommandPane.prototype.setFocus = function (hasFocus) {
    Pane.prototype.setFocus.call(this, hasFocus);
    if (hasFocus) {
        this.isMessage = false;
        this.doc.setString("");
    }
};

CommandPane.prototype.submitCommand = function (callback) {
    var cmd = this.doc.toString();

    if (cmd === "") {
        // Quit command mode.
        this.window.deactivateCommandPane();
    } else {
        var context = {
            q: function () {
                setTimeout(function () {
                    this.window.shutdown();
                }.bind(this), 0);
            }.bind(this),
            w: function () {
                var activePane = this.window.getActivePane();

                activePane.saveFile(function () {
                    this.window.deactivateCommandPane();
                    this.isMessage = true;
                    this.doc.setString("\"" + path.basename(activePane.doc.filename) + "\" saved");
                    callback()
                }.bind(this));
            }.bind(this),
            e: function () {
                this.showTree(callback);
            }.bind(this)
        };
        var result = null;
        try {
            result = vm.runInNewContext(cmd, context);
        } catch (e) {
            e = "" + e;
            this.isMessage = true;
            this.doc.setString(e);
        }
        if (typeof result === "function") {
            // This is so that if they type "q", it'll evaluate to the "q"
            // function, which we can just call for them.
            result();
        }
        this.window.deactivateCommandPane();
    }

    process.nextTick(callback);
};

CommandPane.prototype.showTree = function () {
    this.window.getActivePane().openRightPane(FileTreePane, true);
};

module.exports = CommandPane;

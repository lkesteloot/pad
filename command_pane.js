// Copyright 2014 Lawrence Kesteloot

"use strict";

var util = require("util");
var vm = require("vm");
var Pane = require("./pane");
var CommandKeys = require("./command_keys");
var CommandFormatter = require("./command_formatter");

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

CommandPane.prototype.getFormatter = function () {
    return new CommandFormatter(this.width, this.hasFocus, this.isMessage);
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
                this.window.getActivePane().saveFile(function () {
                    this.window.deactivateCommandPane();
                    callback()
                }.bind(this));
            }.bind(this)
        };
        try {
            vm.runInNewContext(cmd, context);
        } catch (e) {
            e = "" + e;
            this.isMessage = true;
            this.doc.setString(e);
        }
        this.window.deactivateCommandPane();
    }

    process.nextTick(callback);
};

module.exports = CommandPane;

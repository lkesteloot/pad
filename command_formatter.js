// Copyright 2014 Lawrence Kesteloot

"use strict";

var CommandLine = require("./command_line");

var CommandFormatter = function (width, hasFocus, isMessage) {
    this.width = width;
    this.hasFocus = hasFocus;
    this.isMessage = isMessage;
};

CommandFormatter.prototype.format = function (doc, layout) {
    var text = doc.buffer.toString("utf8");
    var lines = [
        new CommandLine(text, this.hasFocus, this.isMessage),
    ];

    layout.lines = lines;
};

module.exports = CommandFormatter;

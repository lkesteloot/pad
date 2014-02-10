// Copyright 2014 Lawrence Kesteloot

"use strict";

var CommandLine = require("./command_line");

var CommandFormatter = function () {
};

CommandFormatter.prototype.format = function (doc, layout) {
    var text = doc.buffer.toString("utf8");
    var lines = [
        new CommandLine(text),
    ];

    layout.lines = lines;
};

module.exports = CommandFormatter;

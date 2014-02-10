// Copyright 2014 Lawrence Kesteloot

"use strict";

var StatusLayoutLine = require("./status_layout_line");

var StatusFormatter = function () {
};

StatusFormatter.prototype.format = function (doc, layout) {
    var text = doc.buffer.toString("utf8");
    var lines = [
        new StatusLayoutLine(text),
    ];

    layout.lines = lines;
};

module.exports = StatusFormatter;

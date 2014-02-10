// Copyright 2014 Lawrence Kesteloot

"use strict";

var StatusLine = require("./status_line");

var StatusFormatter = function () {
};

StatusFormatter.prototype.format = function (doc, layout) {
    var text = doc.buffer.toString("utf8");
    var lines = [
        new StatusLine(text),
    ];

    layout.lines = lines;
};

module.exports = StatusFormatter;

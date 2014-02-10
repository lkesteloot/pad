// Copyright 2014 Lawrence Kesteloot

"use strict";

var Line = require("./line");

var SimpleFormatter = function () {
};

SimpleFormatter.prototype.format = function (doc, layout) {
    var lines = [];
    var buffer = doc.buffer;

    var addLine = function (start, end, hasEol) {
        var text = buffer.toString("utf8", start, end);
        lines.push(new Line(text, 0, hasEol, start));
    };

    var startOfLine = null;
    for (var i = 0; i < buffer.length; i++) {
        if (startOfLine === null) {
            startOfLine = i;
        }

        if (buffer[i] === 10) {
            addLine(startOfLine, i, true);
            startOfLine = null;
        }
    }

    if (startOfLine !== null) {
        addLine(startOfLine, buffer.length, false);
    }

    layout.lines = lines;
};

module.exports = SimpleFormatter;

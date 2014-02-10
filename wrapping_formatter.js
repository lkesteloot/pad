// Copyright 2014 Lawrence Kesteloot

"use strict";

var Line = require("./line");

var WrappingFormatter = function (wrapWidth) {
    this.wrapWidth = wrapWidth;
};

WrappingFormatter.prototype.format = function (doc, layout) {
    var lines = [];
    var buffer = doc.buffer;

    var addLine = function (start, end, indent, hasEol) {
        var text = buffer.toString("utf8", start, end);
        lines.push(new Line(text, indent, hasEol, start));
    };

    var startOfLine = null;
    var indent = 0;
    for (var i = 0; i < buffer.length; i++) {
        if (startOfLine === null) {
            startOfLine = i;
        }

        // Wrap at one less than the max so that we never go up against the edge,
        // which causes problems when we try to go to the end of the line.
        if (i - startOfLine >= this.wrapWidth - 1) {
            addLine(startOfLine, i, indent, false);
            // Don't lose current character.
            i--;
            indent = 16;
            startOfLine = null;
        } else if (buffer[i] === 10) {
            addLine(startOfLine, i, indent, true);
            startOfLine = null;
            indent = 0;
        }
    }

    if (startOfLine !== null) {
        addLine(startOfLine, buffer.length, indent, false);
    }

    // Must always have at least one line.
    if (lines.length === 0) {
        addLine(0, 0, 0, false);
    }

    layout.lines = lines;
};

module.exports = WrappingFormatter;

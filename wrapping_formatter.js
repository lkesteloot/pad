// Copyright 2014 Lawrence Kesteloot

var LayoutLine = require("./layout_line");

var WrappingFormatter = function (wrapWidth) {
    this.wrapWidth = wrapWidth;
};

WrappingFormatter.prototype.format = function (doc, layout) {
    var lines = [];
    var buffer = doc.buffer;

    var addLine = function (start, end, hasEol) {
        var text = buffer.toString("utf8", start, end);
        lines.push(new LayoutLine(text, 0, hasEol, start));
    };

    var startOfLine = null;
    for (var i = 0; i < buffer.length; i++) {
        if (startOfLine === null) {
            startOfLine = i;
        }

        if (i - startOfLine >= this.wrapWidth) {
            addLine(startOfLine, i, false);
            // Don't lose current character.
            i--;
            startOfLine = null;
        } else if (buffer[i] === 10) {
            addLine(startOfLine, i, true);
            startOfLine = null;
        }
    }

    if (startOfLine !== null) {
        addLine(startOfLine, buffer.length, false);
    }

    layout.lines = lines;
};

module.exports = WrappingFormatter;

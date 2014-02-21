// Copyright 2014 Lawrence Kesteloot

"use strict";

var term = require("./term");

var Layout = function () {
    // Array of Line objects.
    this.lines = [];
};

Layout.prototype.drawLine = function (lineNumber, width) {
    if (lineNumber >= 0 && lineNumber < this.lines.length) {
        this.lines[lineNumber].drawLine(width);
    } else {
        term.dim();
        term.write("~");
        term.clearChars(width - 1);
        term.defaultColor();
    }
};

/**
 * Finds the Line for a given docIndex (offset into a doc buffer). Returns an object with
 * the following fields:
 *
 *     line: the Line object for the line containing the index.
 *     lineNumber: the line number of the layout line.
 *     offset: the offset into the layout line, after indentation.
 *
 * Returns null if not found.
 */
Layout.prototype.docIndexToLayoutPosition = function (docIndex) {
    if (docIndex < 0) {
        docIndex = 0;
    }

    for (var lineNumber = 0; lineNumber < this.lines.length; lineNumber++) {
        var line = this.lines[lineNumber];
        if (line.docIndex === null) {
            // Not really from document. This is a fake line.
            continue;
        }

        var offset = docIndex - line.docIndex;
        if ((offset >= 0 && offset < line.text.length) ||
            (offset == line.text.length && (line.hasEol ||
                                            lineNumber == this.lines.length - 1))) {

            return {
                line: line,
                lineNumber: lineNumber,
                offset: offset
            };
        }
    }

    return null;
};

module.exports = Layout;

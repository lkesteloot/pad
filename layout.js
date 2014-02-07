// Copyright 2014 Lawrence Kesteloot

var term = require("./term");

var Layout = function () {
    // Array of LayoutLine objects.
    this.lines = [];
};

Layout.prototype.drawLine = function (lineNumber, width) {
    if (lineNumber >= 0 && lineNumber < this.lines.length) {
        this.lines[lineNumber].drawLine(width);
    } else {
        term.write("~");
        term.clearChars(width - 1);
    }
};

/**
 * Finds the LayoutLine for a given docIndex (offset into a doc buffer). Returns an object with
 * the following fields:
 *
 *     layoutLine: the LayoutLine object for the line containing the index.
 *     lineNumber: the line number of the layout line.
 *     offset: the offset into the layout line, after indentation.
 *
 * Returns null if not found.
 */
Layout.prototype.docIndexToLayoutPosition = function (docIndex) {
    for (var lineNumber = 0; lineNumber < this.lines.length; lineNumber++) {
        var layoutLine = this.lines[lineNumber];

        var offset = docIndex - layoutLine.docIndex;
        if ((offset >= 0 && offset < layoutLine.text.length) ||
            (layoutLine.hasEol && offset == layoutLine.text.length)) {

            return {
                layoutLine: layoutLine,
                lineNumber: lineNumber,
                offset: offset
            };
        }
    }

    return null;
};

module.exports = Layout;

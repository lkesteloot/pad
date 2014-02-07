// Copyright 2014 Lawrence Kesteloot

var LayoutLine = require("./layout_line");

var WrappingFormatter = function (wrapWidth) {
    this.wrapWidth = wrapWidth;
};

WrappingFormatter.prototype.format = function (doc, layout) {
    var lines = [];
    var self = this;

    doc.lines.forEach(function (docLine, lineNumber) {
        var column = 0;
        var subsequentIndent = docLine.match(/^ */)[0].length + 8;

        do {
            var subtext = docLine.substring(0, self.wrapWidth);
            var indent = column == 0 ? 0 : subsequentIndent;
            lines.push(new LayoutLine(subtext, indent, lineNumber, column));

            column += self.wrapWidth;
            docLine = docLine.substring(self.wrapWidth);
        } while (docLine != "");
    });

    layout.lines = lines;
};

module.exports = WrappingFormatter;

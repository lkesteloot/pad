// Copyright 2014 Lawrence Kesteloot

var _ = require("underscore");
var LayoutLine = require("./layout_line").LayoutLine;

var WrappingFormatter = function (wrapWidth) {
    this.wrapWidth = wrapWidth;
};

WrappingFormatter.prototype.format = function (buffer, layout) {
    var lines = [];
    var self = this;

    _.each(buffer.lines, function (bufferLine, lineNumber) {
        var column = 0;
        var subsequentIndent = bufferLine.match(/^ */)[0].length + 8;

        do {
            var subtext = bufferLine.substring(0, self.wrapWidth);
            var indent = column == 0 ? 0 : subsequentIndent;
            lines.push(new LayoutLine(subtext, indent, lineNumber, column));

            column += self.wrapWidth;
            bufferLine = bufferLine.substring(self.wrapWidth);
        } while (bufferLine != "");
    });

    layout.lines = lines;
};

exports.WrappingFormatter = WrappingFormatter;

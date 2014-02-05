// Copyright 2014 Lawrence Kesteloot

var LayoutLine = require("./layout_line");

var SimpleFormatter = function () {
};

SimpleFormatter.prototype.format = function (buffer, layout) {
    var lines = [];

    buffer.lines.forEach(function (bufferLine, lineNumber) {
        lines.push(new LayoutLine(bufferLine, 0, lineNumber, 0));
    });

    layout.lines = lines;
};

module.exports = SimpleFormatter;

// Copyright 2014 Lawrence Kesteloot

var _ = require("underscore");
var LayoutLine = require("./layout_line").LayoutLine;

var SimpleFormatter = function () {
};

SimpleFormatter.prototype.format = function (buffer, layout) {
    var lines = [];

    _.each(buffer.lines, function (bufferLine, lineNumber) {
        lines.push(new LayoutLine(bufferLine, 0, lineNumber, 0));
    });

    layout.lines = lines;
};

exports.SimpleFormatter = SimpleFormatter;

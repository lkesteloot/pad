// Copyright 2014 Lawrence Kesteloot

var LayoutLine = require("./layout_line");

var SimpleFormatter = function () {
};

SimpleFormatter.prototype.format = function (doc, layout) {
    var lines = [];

    doc.lines.forEach(function (docLine, lineNumber) {
        lines.push(new LayoutLine(docLine, 0, lineNumber, 0));
    });

    layout.lines = lines;
};

module.exports = SimpleFormatter;

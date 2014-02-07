// Copyright 2014 Lawrence Kesteloot

var term = require("./term");
var strings = require("./strings");

var LayoutLine = function (text, indent, hasEol, docIndex) {
    this.text = text;
    this.indent = indent;
    this.hasEol = hasEol;
    this.docIndex = docIndex;
};

LayoutLine.prototype.drawLine = function (width) {
    if (this.indent) {
        var indent = strings.repeat(".", this.indent);
        term.sgr(90);
        term.write(indent);
    }

    term.defaultColor();
    term.write(this.text);
    term.clearChars(width - this.text.length - this.indent);
};

module.exports = LayoutLine;

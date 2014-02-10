// Copyright 2014 Lawrence Kesteloot

"use strict";

var term = require("./term");
var strings = require("./strings");

var Line = function (text, indent, hasEol, docIndex) {
    this.text = text;
    this.indent = indent;
    this.hasEol = hasEol;
    this.docIndex = docIndex;
};

Line.prototype.drawLine = function (width) {
    if (this.indent) {
        var indent = strings.repeat(".", this.indent);
        term.sgr(90);
        term.write(indent);
    }

    term.defaultColor();
    term.write(this.text);
    term.clearChars(width - this.text.length - this.indent);
};

Line.prototype.getPrefixLength = function () {
    return this.indent;
};

module.exports = Line;

// Copyright 2014 Lawrence Kesteloot

"use strict";

var term = require("./term");
var strings = require("./strings");

var Line = function (text, indent, hasEol, docIndex) {
    this.text = text;
    this.indent = indent;
    this.hasEol = hasEol;
    this.docIndex = docIndex;
    this.fragments = [];
};

Line.prototype.addFragment = function (fragment) {
    this.fragments.push(fragment);
};

Line.prototype.drawLine = function (width) {
    if (this.indent) {
        var indent = strings.repeat(".", this.indent);
        term.sgr(90);
        term.write(indent);
    }

    var lastStart = 0;
    for (var i = 0; i < this.fragments.length; i++) {
        var fragment = this.fragments[i];
        if (fragment.start > lastStart) {
            // Write skipped text.
            term.defaultColor();
            term.reset();
            term.write(this.text.substring(lastStart, fragment.start));
        }
        fragment.startSection();
        term.write(this.text.substring(fragment.start, fragment.end));
        lastStart = fragment.end;
    }
    if (lastStart < this.text.length) {
        term.defaultColor();
        term.reset();
        term.write(this.text.substring(lastStart));
    }
    term.clearChars(width - this.text.length - this.indent);
};

Line.prototype.getPrefixLength = function () {
    return this.indent;
};

module.exports = Line;

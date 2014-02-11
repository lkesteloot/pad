// Copyright 2014 Lawrence Kesteloot

"use strict";

var util = require("util");
var Line = require("./line.js");
var term = require("./term.js");

var CommandLine = function (text, hasFocus, isMessage) {
    Line.call(this, text, 0, false, 0);
    this.hasFocus = hasFocus;
    this.isMessage = isMessage;
};
util.inherits(CommandLine, Line);

CommandLine.prototype.drawLine = function (width) {
    var wroteCount = 0;

    if (this.isMessage) {
        term.defaultColor();
        term.write(this.text);
        wroteCount += this.text.length;
    } else if (this.hasFocus) {
        term.sgr(90);
        term.write(":");
        wroteCount++;

        term.defaultColor();
        term.write(this.text);
        wroteCount += this.text.length;
    }

    term.clearChars(width - wroteCount);
};

CommandLine.prototype.getPrefixLength = function () {
    return (!this.isMessage && this.hasFocus) ? 1 : 0;
};

module.exports = CommandLine;

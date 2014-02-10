// Copyright 2014 Lawrence Kesteloot

"use strict";

var util = require("util");
var Line = require("./line.js");
var term = require("./term.js");

var StatusLine = function (text) {
    Line.call(this, text, 0, false, 0);
};
util.inherits(StatusLine, Line);

StatusLine.prototype.drawLine = function (width) {
    term.sgr(90);
    term.write(":");
    term.defaultColor();
    term.write(this.text);
    term.clearChars(width - this.text.length - 1);
};

StatusLine.prototype.getPrefixLength = function () {
    return 1;
};

module.exports = StatusLine;

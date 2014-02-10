// Copyright 2014 Lawrence Kesteloot

"use strict";

var util = require("util");
var LayoutLine = require("./layout_line.js");
var term = require("./term.js");

var StatusLayoutLine = function (text) {
    LayoutLine.call(this, text, 0, false, 0);
};
util.inherits(StatusLayoutLine, LayoutLine);

StatusLayoutLine.prototype.drawLine = function (width) {
    term.sgr(90);
    term.write(":");
    term.defaultColor();
    term.write(this.text);
    term.clearChars(width - this.text.length - 1);
};

StatusLayoutLine.prototype.getPrefixLength = function () {
    return 1;
};

module.exports = StatusLayoutLine;

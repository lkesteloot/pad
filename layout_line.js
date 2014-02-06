// Copyright 2014 Lawrence Kesteloot

var term = require("./term");
var strings = require("./strings");

var LayoutLine = function (text, indent, bufferLineNumber, bufferColumn) {
    this.text = text || "";
    this.indent = indent || 0;
    this.bufferLineNumber = bufferLineNumber || 0;
    this.bufferColumn = bufferColumn || 0;
};

LayoutLine.prototype.log = function () {
    var output = "";

    for (var i = 0; i < this.indent; i++) {
        output = output + " ";
    }
    output += this.text;

    console.log(output);
};

LayoutLine.prototype.drawLine = function (width) {
    var indent = strings.repeat(".", this.indent);

    term.sgr(90);
    term.write(indent);
    term.sgr(39);

    term.write(this.text);
    term.clearChars(width - this.text.length - this.indent);
};

module.exports = LayoutLine;

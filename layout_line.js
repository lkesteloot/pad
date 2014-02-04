// Copyright 2014 Lawrence Kesteloot

var term = require("./term");

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
    var indent = new Array(this.indent + 1).join(".");

    term.setColor([30, 1]);
    term.write(indent);
    term.setColor([37, 0]);

    term.write(this.text);
    term.clearChars(width - this.text.length - this.indent);
};

exports.LayoutLine = LayoutLine

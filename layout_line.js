// Copyright 2014 Lawrence Kesteloot

var term = require("./term");
var strings = require("./strings");

var LayoutLine = function (text, indent, docLineNumber, docColumn) {
    this.text = text || "";
    this.indent = indent || 0;
    this.docLineNumber = docLineNumber || 0;
    this.docColumn = docColumn || 0;
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
    term.defaultColor();

    term.write(this.text);
    term.clearChars(width - this.text.length - this.indent);
};

module.exports = LayoutLine;

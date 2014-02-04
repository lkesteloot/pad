// Copyright 2014 Lawrence Kesteloot

var term = require("./term");

var Layout = function () {
    // Array of LayoutLine objects.
    this.lines = [];
};

Layout.prototype.log = function () {
    for (var i = 0; i < this.lines.length; i++) {
        var layoutLine = this.lines[i];

        layoutLine.log();
    }
};

Layout.prototype.drawLine = function (lineNumber, width) {
    if (lineNumber >= 0 && lineNumber < this.lines.length) {
        this.lines[lineNumber].drawLine(width);
    } else {
        term.clearChars(width);
    }
};

exports.Layout = Layout;

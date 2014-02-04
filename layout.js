// Copyright 2014 Lawrence Kesteloot

var fs = require("./layout_line");

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

exports.Layout = Layout;

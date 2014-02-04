// Copyright 2014 Lawrence Kesteloot

var Buffer = require("./buffer.js").Buffer;
var Layout = require("./layout").Layout;
var SimpleFormatter = require("./simple_formatter.js").SimpleFormatter;
var WrappingFormatter = require("./wrapping_formatter.js").WrappingFormatter;
var term = require("./term");

var Pane = function () {
    this.width = 40;
    this.height = 40;
    this.layout = new Layout();
    this.buffer = new Buffer();
    this.formatter = true ? new WrappingFormatter(this.width) : new SimpleFormatter();
    this.layoutDirty = true;
};

Pane.prototype.setBuffer = function (buffer) {
    this.buffer = buffer;
    this.layoutDirty = true;
};

Pane.prototype.reformat = function () {
    if (this.layoutDirty) {
        this.formatter.format(this.buffer, this.layout);
        this.layoutDirty = false;
    }
};

Pane.prototype.redraw = function (x0, y0) {
    this.reformat();

    for (var y = 0; y < this.height; y++) {
        // Move to first position of line.
        term.moveTo(x0, y0 + y);

        // Draw our line.
        this.layout.drawLine(y, this.width);
    }
};

Pane.prototype.log = function () {
    this.reformat();
    this.layout.log();
};

exports.Pane = Pane;

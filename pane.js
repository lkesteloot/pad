// Copyright 2014 Lawrence Kesteloot

var Buffer = require("./buffer.js").Buffer;
var Layout = require("./layout").Layout;
var SimpleFormatter = require("./simple_formatter.js").SimpleFormatter;
var WrappingFormatter = require("./wrapping_formatter.js").WrappingFormatter;

var Pane = function () {
    this.layout = new Layout();
    this.buffer = new Buffer();
    this.formatter = true ? new WrappingFormatter() : new SimpleFormatter();
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

Pane.prototype.log = function () {
    this.reformat();
    this.layout.log();
};

exports.Pane = Pane;

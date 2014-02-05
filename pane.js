// Copyright 2014 Lawrence Kesteloot

var Buffer = require("./buffer.js");
var Layout = require("./layout");
var SimpleFormatter = require("./simple_formatter.js");
var WrappingFormatter = require("./wrapping_formatter.js");
var term = require("./term");

var Pane = function (x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.layout = new Layout();
    this.buffer = new Buffer();
    this.layoutDirty = true;
};

Pane.prototype.setBuffer = function (buffer) {
    this.buffer = buffer;
    this.layoutDirty = true;
};

Pane.prototype.reformatIfNecessary = function () {
    if (this.layoutDirty) {
        var formatter = true ? new WrappingFormatter(this.width) : new SimpleFormatter();
        formatter.format(this.buffer, this.layout);
        this.layoutDirty = false;
    }
};

Pane.prototype.redraw = function () {
    this.reformatIfNecessary();

    for (var y = 0; y < this.height; y++) {
        // Move to first position of line.
        term.moveTo(this.x, this.y + y);

        // Draw our line.
        this.layout.drawLine(y, this.width);
    }
};

Pane.prototype.log = function () {
    this.reformatIfNecessary();
    this.layout.log();
};

Pane.prototype.loadFile = function (filename) {
    var buffer = new Buffer();
    var self = this;

    buffer.readFile(filename, function () {
        self.setBuffer(buffer);
        self.redraw();
    }, function (err) {
        if (err.code === "ENOENT") {
            console.log("File not found: " + filename);
        } else {
            console.log("Error loading file: " + err);
        }
    });
};

Pane.prototype.resize = function (width, height) {
    this.width = width;
    this.height = height;
    this.layoutDirty = true;
    this.redraw();
};

module.exports = Pane;

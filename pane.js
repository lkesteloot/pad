// Copyright 2014 Lawrence Kesteloot

var Buffer = require("./buffer");
var Layout = require("./layout");
var SimpleFormatter = require("./simple_formatter");
var WrappingFormatter = require("./wrapping_formatter");
var ViKeys = require("./vi_keys");
var term = require("./term");

var Pane = function (x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.cursorX = 0; // In layout space.
    this.cursorY = 0;
    this.topY = 0; // Top of pane, in layout space.
    this.layout = new Layout();
    this.buffer = new Buffer();
    this.keys = new ViKeys();
    this.layoutDirty = true;
    this.redrawDirty = true;
};

Pane.prototype.setBuffer = function (buffer) {
    this.buffer = buffer;
    this.layoutDirty = true;
    this.redrawDirty = true;
};

Pane.prototype.reformatIfNecessary = function () {
    if (this.layoutDirty) {
        var formatter = true ? new WrappingFormatter(this.width) : new SimpleFormatter();
        formatter.format(this.buffer, this.layout);
        this.layoutDirty = false;
    }
};

Pane.prototype.redrawIfNecessary = function () {
    if (this.redrawDirty || this.layoutDirty) {
        this.reformatIfNecessary();

        for (var y = 0; y < this.height; y++) {
            // Move to first position of line.
            term.moveTo(this.x, this.y + y);

            // Draw our line.
            this.layout.drawLine(this.topY + y, this.width);
        }

        this.positionCursor();

        this.redrawDirty = false;
    }
};

Pane.prototype.scrollToCursor = function () {
    if (this.topY > this.cursorY) {
        this.topY = this.cursorY;
        this.redrawDirty = true;
    } else if (this.topY < this.cursorY - (this.height - 1)) {
        this.topY = this.cursorY - (this.height - 1);
        this.redrawDirty = true;
    }
};

Pane.prototype.positionCursor = function () {
    term.moveTo(this.x + this.cursorX, this.y + this.cursorY - this.topY);
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
        self.redrawIfNecessary();
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
    this.redrawIfNecessary();
};

Pane.prototype.onKey = function (key) {
    this.keys.onKey(key, this);

    // Clamp cursor to layout.
    if (this.cursorY < 0) {
        this.cursorY = 0;
    }
    if (this.cursorY > this.layout.lines.length - 1) {
        this.cursorY = this.layout.lines.length - 1;
    }

    this.scrollToCursor();
    this.redrawIfNecessary();
    this.positionCursor();
};

module.exports = Pane;

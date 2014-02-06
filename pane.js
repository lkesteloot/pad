// Copyright 2014 Lawrence Kesteloot

var Buffer = require("./buffer");
var Layout = require("./layout");
var SimpleFormatter = require("./simple_formatter");
var WrappingFormatter = require("./wrapping_formatter");
var ViKeys = require("./vi_keys");
var term = require("./term");
var trace = require("./trace");
var strings = require("./strings");

var Pane = function (x, y, width, height) {
    this.filename = "";
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.contentHeight = height - 3;
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
        trace.log("Redrawing");

        term.setCursorVisibility(false);

        for (var y = 0; y < this.contentHeight; y++) {
            // Move to first position of line.
            term.moveTo(this.x, this.y + y);

            // Draw our line.
            this.layout.drawLine(this.topY + y, this.width);
        }

        // Draw status line.
        term.moveTo(this.x, this.contentHeight);
        term.setColor(7);
        term.write(this.generateStatusLine());
        term.moveTo(this.x, this.contentHeight + 1);
        term.setColor(0);
        term.clearChars(this.width);
        term.moveTo(this.x, this.contentHeight + 2);
        term.setColor(0);
        term.clearChars(this.width);

        this.positionCursor();
        term.setCursorVisibility(true);

        this.redrawDirty = false;
    }
};

Pane.prototype.scrollToCursor = function () {
    if (this.topY > this.cursorY) {
        this.topY = this.cursorY;
        this.redrawDirty = true;
    } else if (this.topY < this.cursorY - (this.contentHeight - 1)) {
        this.topY = this.cursorY - (this.contentHeight - 1);
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
        self.filename = filename;
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
    this.contentHeight = height - 3;
    this.layoutDirty = true;
    this.redrawIfNecessary();
};

Pane.prototype.onKey = function (key) {
    this.keys.onKey(key, this);

    // Clamp cursor to layout.
    var layoutLineCount = this.layout.lines.length;
    if (this.topY < 0) {
        this.topY = 0;
    }
    if (this.topY > layoutLineCount - 1) {
        this.topY = layoutLineCount - 1;
    }
    if (this.cursorY < 0) {
        this.cursorY = 0;
    }
    if (this.cursorY > layoutLineCount - 1) {
        this.cursorY = layoutLineCount - 1;
    }
    if (this.cursorX < 0) {
        this.cursorX = 0;
    }
    var lineLength = this.layout.lines[this.cursorY].text.length;
    if (this.cursorX > lineLength - 1) {
        this.cursorX = lineLength - 1;
    }

    this.scrollToCursor();
    this.redrawIfNecessary();
    this.positionCursor();
};

Pane.prototype.generateStatusLine = function () {
    var line = "";

    line += strings.unexpandHome(this.filename);

    return line + strings.repeat(" ", this.width - line.length);
};

module.exports = Pane;

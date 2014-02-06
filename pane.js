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
        this.redrawDirty = true;
    }
};

Pane.prototype.redrawIfNecessary = function () {
    this.reformatIfNecessary();
    if (this.redrawDirty) {
        trace.log("Redrawing");

        term.hideCursor();

        for (var y = 0; y < this.contentHeight; y++) {
            // Move to first position of line.
            term.moveTo(this.x, this.y + y);

            // Draw our line.
            this.layout.drawLine(this.topY + y, this.width);
        }

        // Draw status line.
        term.moveTo(this.x, this.contentHeight);
        term.reverse();
        term.write(this.generateStatusLine());
        term.reverseOff();

        term.moveTo(this.x, this.contentHeight + 1);
        term.clearChars(this.width);
        term.moveTo(this.x, this.contentHeight + 2);
        term.clearChars(this.width);

        this.positionCursor();
        term.showCursor();

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

    buffer.readFile(filename, function (err) {
        if (err) {
            if (err.code === "ENOENT") {
                console.log("File not found: " + filename);
            } else {
                console.log("Error loading file: " + err);
            }
        } else {
            self.filename = filename;
            self.setBuffer(buffer);
            self.redrawIfNecessary();
        }
    });
};

Pane.prototype.saveFile = function (callback) {
    var self = this;

    this.buffer.saveFile(this.filename, function (err) {
        // XXX check err.
        // Update the status line:
        self.redrawDirty = true;
        callback();
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
    this.keys.onKey(key, this, this.sanitizeAndRefresh.bind(this));
};

Pane.prototype.sanitizeAndRefresh = function () {
    // Reformat so that have proper line bounds.
    this.reformatIfNecessary();

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
    if (this.cursorX > lineLength) {
        // This is different than vi. Vi clamps to the last character, and we let it go
        // past that. It's consistent with what happens on an empty line.
        this.cursorX = lineLength;
    }

    this.scrollToCursor();
    this.redrawIfNecessary();
    this.positionCursor();
};

Pane.prototype.generateStatusLine = function () {


    var left = strings.unexpandHome(this.filename);
    if (this.buffer.modified) {
        left += " [+]";
    }
    var right = this.keys.getStatus();
    return left + strings.repeat(" ", this.width - left.length - right.length) + right;
};

Pane.prototype.backspaceCharacter = function () {
    var layoutLine = this.layout.lines[this.cursorY];
    var layoutX = this.cursorX - layoutLine.indent;
    if (layoutX < 0) {
        // Shouldn't happen -- we're on an indent.
        return;
    }

    var text = this.buffer.lines[layoutLine.bufferLineNumber];
    var x = layoutX + layoutLine.bufferColumn;
    if (x === 0) {
        // Backspacing at front of line, merge lines.
        if (layoutLine.bufferLineNumber > 0) {
            this.buffer.mergeLines(layoutLine.bufferLineNumber);
            this.cursorY--;
            this.cursorX = 99999;
            this.layoutDirty = true;
        }
    } else {
        text = text.substring(0, x - 1) + text.substring(x);
        this.buffer.setLine(layoutLine.bufferLineNumber, text);
        this.cursorX--;
        this.layoutDirty = true;
    }
};

Pane.prototype.insertCharacter = function (ch) {
    var layoutLine = this.layout.lines[this.cursorY];
    var layoutX = this.cursorX - layoutLine.indent;
    if (layoutX < 0) {
        // Shouldn't happen -- we're on an indent.
        return;
    }

    var bufferLineNumber = layoutLine.bufferLineNumber;
    var text = this.buffer.lines[bufferLineNumber];
    var x = layoutX + layoutLine.bufferColumn;
    var beforeCursor = text.substring(0, x)
    var afterCursor = text.substring(x)
    if (ch === "\n" || ch === "\r") {
        this.buffer.insertLine(bufferLineNumber + 1);
        this.buffer.setLine(bufferLineNumber, beforeCursor);
        this.buffer.setLine(bufferLineNumber + 1, afterCursor);
        this.cursorY++;
        this.cursorX = 0;
    } else {
        text = beforeCursor + ch + afterCursor;
        this.buffer.setLine(layoutLine.bufferLineNumber, text);
        this.cursorX++;
    }

    this.layoutDirty = true;
};

module.exports = Pane;

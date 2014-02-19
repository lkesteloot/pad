// Copyright 2014 Lawrence Kesteloot

"use strict";

var Doc = require("./doc");
var Layout = require("./layout");
var SimpleFormatter = require("./simple_formatter");
var WrappingFormatter = require("./wrapping_formatter");
var ViKeys = require("./vi_keys");
var term = require("./term");
var trace = require("./trace");
var strings = require("./strings");

var Pane = function (window, x, y, width, height) {
    this.window = window;
    this.x = x;
    this.y = y;
    this.setWidth(width, false);
    this.height = height;
    this.hasFocus = false;
    this.contentHeight = this.hasStatusLine() ? height - 1 : height;
    this.cursorX = 0; // In layout space.
    this.cursorY = 0;
    this.docIndex = 0;
    this.topY = 0; // Top of pane, in layout space.
    this.layout = new Layout();
    this.setDoc(new Doc());
    this.keys = new ViKeys();
    this.keys.events.on("mode", Pane.prototype.onKeysModeChange.bind(this));
    this.keys.events.on("mode", Pane.prototype.onKeysStateChange.bind(this));
    this.keys.events.on("verb", Pane.prototype.onKeysStateChange.bind(this));
    this.keys.events.on("count", Pane.prototype.onKeysStateChange.bind(this));
    this.keys.events.on("verbCount", Pane.prototype.onKeysStateChange.bind(this));
    this.layoutDirty = true;
    this.redrawDirty = true;
    this.desiredDocIndex = null;
    this.queueRedraw();
};

Pane.prototype.hasStatusLine = function () {
    return true;
};

Pane.prototype.queueRedraw = function () {
    setTimeout(this.sanitizeAndRefresh.bind(this), 0);
};

Pane.prototype.setDoc = function (doc) {
    this.doc = doc;
    this.doc.events.on("change", this.onDocModified.bind(this));
    this.doc.events.on("modified", this.onDocModified.bind(this));
    this.layoutDirty = true;
    this.queueRedraw();
};

Pane.prototype.onDocModified = function () {
    this.layoutDirty = true;
    process.nextTick(this.sanitizeAndRefresh.bind(this));
};

Pane.prototype.setFocus = function (hasFocus) {
    this.hasFocus = hasFocus;
    if (this.hasFocus) {
        this.positionCursor();
    }
};

Pane.prototype.reformatIfNecessary = function () {
    if (this.layoutDirty) {
        var formatter = this.getFormatter();
        formatter.format(this.doc, this.layout);
        this.layoutDirty = false;
        this.redrawDirty = true;
    }
};

Pane.prototype.getFormatter = function () {
    return new WrappingFormatter(this.contentWidth);
};

Pane.prototype.redrawIfNecessary = function () {
    this.reformatIfNecessary();
    if (this.redrawDirty) {
        trace.log("Redrawing");

        term.hideCursor();
        if (!this.hasFocus) {
            term.savePosition();
        }

        var verticalLine = strings.repeat(" ", this.width - this.contentWidth);
        for (var y = 0; y < this.contentHeight; y++) {
            // Move to first position of line.
            term.moveTo(this.x, this.y + y);

            // Draw our line.
            this.layout.drawLine(this.topY + y, this.width);

            // Draw vertical divider if necessary.
            term.reset();
            term.reverse();
            if (verticalLine !== "") {
                term.moveTo(this.x + this.width - verticalLine.length, this.y + y);
                term.write(verticalLine);
            }
            term.reverseOff();
        }

        // Draw status line.
        if (this.hasStatusLine()) {
            term.moveTo(this.x, this.y + this.contentHeight);
            term.reset();
            term.reverse();
            term.write(this.generateStatusLine());
            term.reverseOff();
        }

        if (this.hasFocus) {
            this.positionCursor();
        } else {
            term.restorePosition();
        }
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

Pane.prototype.onKeysModeChange = function () {
    switch (this.keys.mode) {
        case ViKeys.MODE_NORMAL:
        default:
            term.blockCursor();
            break;

        case ViKeys.MODE_INSERT:
            term.barCursor();
            break;

        case ViKeys.MODE_REPLACE:
            term.underlineCursor();
            break;
    }
};

Pane.prototype.onKeysStateChange = function () {
    this.redrawDirty = true;
};

Pane.prototype.loadFile = function (filename, callback) {
    var doc = new Doc();
    var self = this;

    doc.readFile(filename, function (err) {
        if (err) {
            if (err.code === "ENOENT") {
                console.log("File not found: " + filename);
            } else {
                console.log("Error loading file: " + err);
            }
        } else {
            self.setDoc(doc);
            self.redrawIfNecessary();
            if (callback) {
                callback();
            }
        }
    });
};

Pane.prototype.saveFile = function (callback) {
    var self = this;

    this.doc.saveFile(function (err) {
        // XXX check err.
        // Update the status line:
        self.redrawDirty = true;
        callback();
    });
};

Pane.prototype.resize = function (width, height) {
    // XXX This function is out of date. Copy behavior in constructor.
    this.width = width;
    this.height = height;
    this.contentHeight = height - 3;
    this.layoutDirty = true;
    this.redrawIfNecessary();
};

Pane.prototype.setWidth = function (width, redraw) {
    this.width = width;
    this.contentWidth = (this.x + width != this.window.width) ? width - 1 : width;
    if (redraw !== false) {
        this.layoutDirty = true;
        this.queueRedraw();
    }
};

Pane.prototype.onKey = function (key) {
    this.keys.onKey(key, this, this.sanitizeAndRefresh.bind(this));
};

Pane.prototype.sanitizeAndRefresh = function () {
    // Reformat so that have proper line bounds.
    this.reformatIfNecessary();

    if (this.desiredDocIndex !== null) {
        var layoutPosition = this.layout.docIndexToLayoutPosition(this.desiredDocIndex);
        if (layoutPosition === null) {
            trace.log("Can't find layout position for doc index " + this.desiredDocIndex);
        } else {
            this.cursorX = layoutPosition.layoutLine.getPrefixLength() + layoutPosition.offset;
            this.cursorY = layoutPosition.lineNumber;
        }
        this.desiredDocIndex = null;
    }

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
    var layoutLine = this.layout.lines[this.cursorY];
    if (this.cursorX < layoutLine.getPrefixLength()) {
        this.cursorX = layoutLine.getPrefixLength();
    }
    var lineLength = layoutLine.text.length;
    if (this.cursorX > layoutLine.getPrefixLength() + lineLength) {
        // This is different than vi. Vi clamps to the last character, and we let it go
        // past that. It's consistent with what happens on an empty line.
        this.cursorX = layoutLine.getPrefixLength() + lineLength;
    }

    // Find the location in the doc.
    var layoutX = this.cursorX - layoutLine.getPrefixLength();
    if (layoutX < 0) {
        // Shouldn't happen -- we're on an indent.
        throw new Error("Cursor was on indent");
    }
    this.docIndex = layoutLine.docIndex + layoutX;

    this.scrollToCursor();
    this.redrawIfNecessary();
    if (this.hasFocus) {
        this.positionCursor();
    }
};

Pane.prototype.generateStatusLine = function () {
    var left;
    if (this.doc.filename === "") {
        left = "[No Name]";
    } else {
        left = strings.unexpandHome(this.doc.filename);
    }
    if (this.doc.modified) {
        left += " [+]";
    }

    var right = this.keys.getState();

    // XXX Check for line overflow.
    return left + strings.repeat(" ", this.width - left.length - right.length) + right;
};

module.exports = Pane;

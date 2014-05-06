// Copyright 2014 Lawrence Kesteloot

"use strict";

var events = require("events");
var path = require("path");
var Doc = require("./doc");
var Layout = require("./layout");
var WrappingFormatter = require("./wrapping_formatter");
var ViKeys = require("./vi_keys");
var term = require("./term");
var trace = require("./trace");
var strings = require("./strings");

var Pane = function (window, x, y, width, height, mainPane) {
    this.events = new events.EventEmitter();
    this.window = window;
    this.x = x;
    this.y = y;
    this.resize(width, height);
    this.mainPane = mainPane || null;
    this.leftPane = null;
    this.rightPane = null;
    this.hasFocus = false;
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

// Sub-class can override.
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
    this.cursorX = 0; // In layout space.
    this.cursorY = 0;
    this.docIndex = 0;
    this.topY = 0; // Top of pane, in layout space.
    this.layoutDirty = true;
    this.queueRedraw();
    this.events.emit("change");
};

Pane.prototype.onDocModified = function () {
    this.layoutDirty = true;
    process.nextTick(this.sanitizeAndRefresh.bind(this));
    this.events.emit("change");
};

Pane.prototype.setFocus = function (hasFocus) {
    this.hasFocus = hasFocus;
    if (this.hasFocus) {
        this.positionCursor();
    }
};

Pane.prototype.reformatIfNecessary = function () {
    if (this.layoutDirty) {
        this.format();
        this.layoutDirty = false;
        this.redrawDirty = true;
        this.events.emit("format");
    }
};

/**
 * Subclass can override this. Must update this.layout.
 */
Pane.prototype.format = function () {
    trace.log("format()");
    var formatter = new WrappingFormatter(this.contentWidth);
    formatter.format(this.doc, this.layout);
};

Pane.prototype.redrawIfNecessary = function () {
    this.reformatIfNecessary();
    if (this.redrawDirty) {
        this.redraw();
        this.redrawDirty = false;
    }
};

Pane.prototype.redraw = function () {
    trace.log("redraw()");

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
        term.reset();

        // Draw vertical divider if necessary.
        if (verticalLine !== "") {
            term.moveTo(this.x + this.width - verticalLine.length, this.y + y);
            term.reverse();
            term.write(verticalLine);
            term.reverseOff();
        }
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
};

Pane.prototype.scrollToCursor = function () {
    var halfPage = Math.floor(this.contentHeight / 2);

    if (this.topY > this.cursorY + halfPage) {
        // If too far away, center cursor.
        this.topY = Math.max(this.cursorY - halfPage, 0);
        this.redrawDirty = true;
    } else if (this.topY > this.cursorY) {
        this.topY = this.cursorY;
        this.redrawDirty = true;
    } else {
        var minTop = this.cursorY - (this.contentHeight - 1);
        if (this.topY < minTop - halfPage) {
            this.topY = minTop + halfPage;
            this.redrawDirty = true;
        } else if (this.topY < minTop) {
            this.topY = minTop;
            this.redrawDirty = true;
        }
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
    var pathname = path.resolve(filename);

    doc.readFile(pathname, function (err) {
        if (err) {
            if (err.code === "ENOENT") {
                console.log("File not found: " + pathname);
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
    this.setWidth(width);
    this.height = height;
    this.contentHeight = this.hasStatusLine() ? height - 1 : height;
    this.layoutDirty = true;
};

Pane.prototype.setWidth = function (width) {
    this.width = width;
    this.contentWidth = (this.x + width != this.window.width) ? width - 1 : width;
    this.layoutDirty = true;
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
            this.cursorX = layoutPosition.line.getPrefixLength() + layoutPosition.offset;
            this.cursorY = layoutPosition.lineNumber;
        }
        this.desiredDocIndex = null;
    }

    // Clamp cursor to layout.
    var lineCount = this.layout.lines.length;
    if (this.topY < 0) {
        this.topY = 0;
    }
    if (this.topY > lineCount - 1) {
        this.topY = lineCount - 1;
    }
    if (this.cursorY < 0) {
        this.cursorY = 0;
    }
    if (this.cursorY > lineCount - 1) {
        this.cursorY = lineCount - 1;
    }
    if (this.cursorX < 0) {
        this.cursorX = 0;
    }
    var line = this.layout.lines[this.cursorY];
    if (this.cursorX < line.getPrefixLength()) {
        this.cursorX = line.getPrefixLength();
    }
    var lineLength = line.text.length;
    if (this.cursorX > line.getPrefixLength() + lineLength) {
        // This is different than vi. Vi clamps to the last character, and we let it go
        // past that. It's consistent with what happens on an empty line.
        this.cursorX = line.getPrefixLength() + lineLength;
    }

    // Find the location in the doc.
    var layoutX = this.cursorX - line.getPrefixLength();
    if (layoutX < 0) {
        // Shouldn't happen -- we're on an indent.
        throw new Error("Cursor was on indent");
    }
    this.docIndex = line.docIndex + layoutX;

    this.scrollToCursor();
    this.redrawIfNecessary();
    if (this.hasFocus) {
        this.positionCursor();
    }
};

// This is responsible for the whole width, not just the contentWidth.
Pane.prototype.generateStatusLine = function () {
    // Left half of the status line (filename, modified).
    var left;
    if (this.doc.filename === "") {
        left = "[No Name]";
    } else {
        left = strings.unexpandHome(this.doc.filename);
    }
    if (this.doc.isModified()) {
        left += " [+]";
    }

    // Right half (key-specific state).
    var right = this.keys.getState(this);

    // Padding in the middle. Clip to make room.
    var paddingSize = this.contentWidth - left.length - right.length;
    if (paddingSize < 0) {
        left = "..." + left.substring(-paddingSize + 3);
        paddingSize = this.contentWidth - left.length - right.length;
    }
    var padding = strings.repeat(" ", paddingSize);

    // The spot under the vertical divider.
    var divider = strings.repeat(" ", this.width - this.contentWidth);

    return left + padding + right + divider;
};

/**
 * Return the current line, not including the EOL.
 */
Pane.prototype.getCurrentLine = function () {
    var start = this.doc.findStartOfLine(this.docIndex);
    var end = this.doc.findEndOfLine(start);

    return this.doc.toString(start, end);
};

Pane.prototype.openRightPane = function (paneConstructor, activate) {
    this.closeRightPane();

    if (!paneConstructor) {
        paneConstructor = Pane;
    }

    this.desiredDocIndex = this.docIndex;

    var split = Math.floor(this.width*2/3);
    this.rightPane = new paneConstructor(this.window,
                                         this.x + split, this.y,
                                         this.width - split, this.height, this);
    this.setWidth(split);
    this.queueRedraw();
    this.window.panes.push(this.rightPane);

    if (activate) {
        this.window.setActivePane(this.rightPane);
    }

    return this.rightPane;
};

Pane.prototype.closeRightPane = function () {
    if (this.rightPane !== null) {
        this.window.closePane(this.rightPane);
        this.rightPane = null;
    }
};

module.exports = Pane;

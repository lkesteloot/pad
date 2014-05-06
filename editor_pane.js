// Copyright 2014 Lawrence Kesteloot

"use strict";

var util = require("util");
var path = require("path");
var WrappingFormatter = require("./wrapping_formatter");
var Doc = require("./doc");
var Pane = require("./pane");
var strings = require("./strings");

// Subclass of Pane that edits a document.
var EditorPane = function (window, x, y, width, height, mainPane) {
    Pane.call(this, window, x, y, width, height, mainPane);

    this.setDoc(new Doc());
};
util.inherits(EditorPane, Pane);

// Override
EditorPane.prototype.format = function () {
    Pane.prototype.format.call(this);

    var formatter = new WrappingFormatter(this.contentWidth);
    formatter.format(this.doc, this.layout);
};

// Override
EditorPane.prototype.generateStatusLine = function () {
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

EditorPane.prototype.setDoc = function (doc) {
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

EditorPane.prototype.onDocModified = function () {
    this.layoutDirty = true;
    process.nextTick(this.sanitizeAndRefresh.bind(this));
    this.events.emit("change");
};

EditorPane.prototype.loadFile = function (filename, callback) {
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

EditorPane.prototype.saveFile = function (callback) {
    var self = this;

    this.doc.saveFile(function (err) {
        // XXX check err.
        // Update the status line:
        self.redrawDirty = true;
        callback();
    });
};

/**
 * Return the current line, not including the EOL.
 */
EditorPane.prototype.getCurrentLine = function () {
    var start = this.doc.findStartOfLine(this.docIndex);
    var end = this.doc.findEndOfLine(start);

    return this.doc.toString(start, end);
};

module.exports = EditorPane;

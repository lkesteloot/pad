// Copyright 2014 Lawrence Kesteloot

"use strict";

var events = require("events");
var trace = require("./trace");

var ViKeys = function () {
    this.events = new events.EventEmitter();
    this.setCount(null);
    this.setMode(ViKeys.MODE_NORMAL);
    this.setVerb(null);
    this.setVerbCount(null);
};

ViKeys.MODE_NORMAL = 0;
ViKeys.MODE_INSERT = 1;
ViKeys.MODE_REPLACE = 2;

/**
 * A printable version of our internal state.
 **/
ViKeys.prototype.getState = function () {
    return (this.count || "") + (this.verb || "") + (this.verbCount || "");
};

ViKeys.prototype.onKey = function (key, pane, callback) {
    switch (this.mode) {
        case ViKeys.MODE_NORMAL:
            this.handleNormalKey(key, pane, callback);
            break;

        case ViKeys.MODE_INSERT:
            this.handleInsertKey(key, pane, callback);
            break;

        default:
            throw new Error("Unknown mode " + this.mode);
    }
};

ViKeys.prototype.handleNormalKey = function (key, pane, callback) {
    if (this.verb === null) {
        this.handleUnverbedKey(key, pane, callback);
    } else {
        this.handleVerbedKey(key, pane, callback);
    }
};

ViKeys.prototype.handleVerbedKey = function (key, pane, callback) {
    var docIndex;
    var count = (this.count || 1) * (this.verbCount || 1);

    switch (key) {
        case 27: // ESC
            this.setVerb(null);
            break;

        case 36: // "$"
            pane.doc.deleteCharacters(pane.docIndex, pane.doc.findEndOfLine(pane.docIndex));
            if (this.verb === "c") {
                this.setMode(ViKeys.MODE_INSERT);
            }
            this.setVerb(null);
            break;

        case 48: // "0"
            if (this.verbCount === null) {
                docIndex = pane.doc.findStartOfLine(pane.docIndex);
                pane.doc.deleteCharacters(docIndex, pane.docIndex);
                pane.desiredDocIndex = docIndex;
                if (this.verb === "c") {
                    this.setMode(ViKeys.MODE_INSERT);
                }
                this.setVerb(null);
            } else {
                this.setVerbCount(this.verbCount*10);
            }
            break;

        case 49: // "1" - "9"
        case 50:
        case 51:
        case 52:
        case 53:
        case 54:
        case 55:
        case 56:
        case 57:
            this.setVerbCount((this.verbCount || 0)*10 + (key - 48));
            break;

        case 98: // "b"
            docIndex = pane.doc.findPreviousWord(pane.docIndex, count);
            pane.doc.deleteCharacters(docIndex, pane.docIndex);
            pane.desiredDocIndex = docIndex;
            if (this.verb === "c") {
                this.setMode(ViKeys.MODE_INSERT);
            }
            this.setVerb(null);
            break;

        case 119: // "w"
            docIndex = pane.doc.findNextWord(pane.docIndex, count, this.verb === "c");
            pane.doc.deleteCharacters(pane.docIndex, docIndex);
            if (this.verb === "c") {
                this.setMode(ViKeys.MODE_INSERT);
            }
            this.setVerb(null);
            break;
    }

    process.nextTick(callback);
};

ViKeys.prototype.handleUnverbedKey = function (key, pane, callback) {
    var count = this.count || 1;

    switch (key) {
        case 4: // ^D
            var lineCount = Math.ceil(pane.contentHeight/2);
            pane.cursorY += lineCount;
            pane.topY += lineCount;
            pane.redrawDirty = true;
            break;

        case 10: // ^J
            // Move line down.
            var start = pane.doc.findStartOfLine(pane.docIndex);
            var offset = pane.docIndex - start;
            var end = pane.doc.findNextLine(start);
            var text = pane.doc.toString(start, end);
            pane.doc.deleteCharacters(start, end);
            var nextLine = pane.doc.findNextLine(start);
            pane.doc.insertCharacters(nextLine, text);
            pane.desiredDocIndex = nextLine + offset;
            break;

        case 11: // ^K
            // Move line up.
            var start = pane.doc.findStartOfLine(pane.docIndex);
            if (start > 0) {
                var offset = pane.docIndex - start;
                var end = pane.doc.findNextLine(start);
                var text = pane.doc.toString(start, end);
                pane.doc.deleteCharacters(start, end);
                var previousLine = pane.doc.findStartOfLine(start - 1);
                pane.doc.insertCharacters(previousLine, text);
                pane.desiredDocIndex = previousLine + offset;
            }
            break;

        case 12: // ^L
            pane.redrawDirty = true;
            break;

        case 21: // ^U
            var lineCount = Math.ceil(pane.contentHeight/2);
            pane.cursorY -= lineCount;
            pane.topY -= lineCount;
            pane.redrawDirty = true;
            break;

        case 36: // "$"
            // XXX Not vi compatible: Here we should set the ideal X cursor position
            // to infinity.
            pane.desiredDocIndex = pane.doc.findEndOfLine(pane.docIndex);
            break;

        case 48: // "0"
            if (this.count === null) {
                pane.desiredDocIndex = pane.doc.findStartOfLine(pane.docIndex);
            } else {
                this.setCount(this.count*10);
            }
            break;

        case 49: // "1" - "9"
        case 50:
        case 51:
        case 52:
        case 53:
        case 54:
        case 55:
        case 56:
        case 57:
            this.setCount((this.count || 0)*10 + (key - 48));
            break;

        case 58: ":"
        case 59: ";"
            pane.window.activateCommandPane();
            break;

        case 71: // "G"
            if (this.count === null) {
                pane.cursorY = pane.layout.lines.length - 1;
            } else {
                pane.cursorY = this.count - 1;
                this.setCount(null);
            }
            break;

        case 88: // "X"
            pane.backspaceCharacter();
            break;

        case 98: // "b"
            pane.desiredDocIndex = pane.doc.findPreviousWord(pane.docIndex, count);
            this.setCount(null);
            break;

        case 99: // "c"
            this.setVerb("c");
            break;

        case 100: // "d":
            this.setVerb("d");
            break;

        case 104: // "h"
            pane.cursorX -= count;
            this.setCount(null);
            break;

        case 105: // "i"
            this.setMode(ViKeys.MODE_INSERT);
            break;

        case 106: // "j"
            pane.cursorY += count;
            this.setCount(null);
            break;

        case 107: // "k"
            pane.cursorY -= count;
            this.setCount(null);
            break;

        case 108: // "l"
            pane.cursorX += count;
            this.setCount(null);
            break;

        case 111: // "o":
            pane.openNewLine();
            this.setMode(ViKeys.MODE_INSERT);
            break;

        case 112: // "p":
            pane.window.nextPane();
            break;

        case 119: // "w"
            pane.desiredDocIndex = pane.doc.findNextWord(pane.docIndex, count, false);
            this.setCount(null);
            break;

        case 120: // "x"
            pane.deleteCharacter();
            break;

        case 123: // "{"
            while (pane.cursorY > 0) {
                pane.cursorY--;
                if (pane.layout.lines[pane.cursorY].text.match(/^ *$/)) {
                    break;
                }
            }
            pane.cursorX = 0;
            break;

        case 125: // "}"
            while (pane.cursorY < pane.layout.lines.length - 1) {
                pane.cursorY++;
                if (pane.layout.lines[pane.cursorY].text.match(/^ *$/)) {
                    break;
                }
            }
            pane.cursorX = 0;
            break;

        default:
            // Ignore.
            break;
    }

    process.nextTick(callback);
};

ViKeys.prototype.handleInsertKey = function (key, pane, callback) {
    if (key === 27) {
        // Exit insert mode.
        this.setMode(ViKeys.MODE_NORMAL);
        // XXX Look at this.count and repeat the insert that many times.
        this.setCount(null);
    } else if (key == 8 || key == 127) {
        pane.backspaceCharacter();
    } else if (key < 32 && (key != 10 && key != 13)) {
        // Ignore control keys.
    } else {
        // Convert \r to \n.
        if (key === 13) {
            key = 10;
        }

        pane.insertCharacter(String.fromCharCode(key));
    }

    process.nextTick(callback);
};

ViKeys.prototype.setMode = function (mode) {
    this.mode = mode;
    this.events.emit("mode");
};

ViKeys.prototype.setVerb = function (verb) {
    this.verb = verb;
    this.setVerbCount(null);
    if (verb === null) {
        this.setCount(null);
    }
    this.events.emit("verb");
};

ViKeys.prototype.setCount = function (count) {
    this.count = count;
    this.events.emit("count");
};

ViKeys.prototype.setVerbCount = function (verbCount) {
    this.verbCount = verbCount;
    this.events.emit("verbCount");
};

module.exports = ViKeys;

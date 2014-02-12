// Copyright 2014 Lawrence Kesteloot

"use strict";

var events = require("events");
var trace = require("./trace");

var ViKeys = function () {
    this.count = null;
    this.events = new events.EventEmitter();
    this.setMode(ViKeys.MODE_NORMAL);
    this.verb = null;
    this.verbCount = null;
};

ViKeys.MODE_NORMAL = 0;
ViKeys.MODE_INSERT = 1;
ViKeys.MODE_REPLACE = 2;

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
    if (this.verb === "d") {
        this.handleDeleteVerb(key, pane, callback);
    } else {
        this.handleUnverbedKey(key, pane, callback);
    }
};

ViKeys.prototype.handleDeleteVerb = function (key, pane, callback) {
    var docIndex;
    var count = (this.count || 1) * (this.verbCount || 1);

    switch (key) {
        case 36: // "$"
            pane.doc.deleteCharacters(pane.docIndex, pane.doc.findEndOfLine(pane.docIndex));
            this.setVerb(null);
            break;

        case 48: // "0"
            if (this.verbCount === null) {
                docIndex = pane.doc.findStartOfLine(pane.docIndex);
                pane.doc.deleteCharacters(docIndex, pane.docIndex);
                pane.desiredDocIndex = docIndex;
                this.setVerb(null);
            } else {
                this.verbCount *= 10;
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
            if (this.verbCount === null) {
                this.verbCount = 0;
            }
            this.verbCount = this.verbCount*10 + (key - 48);
            break;

        case 98: // "b"
            docIndex = pane.doc.findPreviousWord(pane.docIndex, count);
            pane.doc.deleteCharacters(docIndex, pane.docIndex);
            pane.desiredDocIndex = docIndex;
            this.setVerb(null);
            break;

        case 119: // "w"
            pane.doc.deleteCharacters(pane.docIndex, pane.doc.findNextWord(pane.docIndex, count));
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
                this.count *= 10;
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
            if (this.count === null) {
                this.count = 0;
            }
            this.count = this.count*10 + (key - 48);
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
                this.count = null;
            }
            break;

        case 88: // "X"
            pane.backspaceCharacter();
            break;

        case 98: // "b"
            pane.desiredDocIndex = pane.doc.findPreviousWord(pane.docIndex, count);
            this.count = null;
            break;

        case 100: // "d":
            this.setVerb("d");
            break;

        case 104: // "h"
            pane.cursorX -= count;
            this.count = null;
            break;

        case 105: // "i"
            this.setMode(ViKeys.MODE_INSERT);
            break;

        case 106: // "j"
            pane.cursorY += count;
            this.count = null;
            break;

        case 107: // "k"
            pane.cursorY -= count;
            this.count = null;
            break;

        case 108: // "l"
            pane.cursorX += count;
            this.count = null;
            break;

        case 111: // "o":
            pane.openNewLine();
            this.setMode(ViKeys.MODE_INSERT);
            break;

        case 112: // "p":
            pane.window.nextPane();
            break;

        case 119: // "w"
            pane.desiredDocIndex = pane.doc.findNextWord(pane.docIndex, count);
            this.count = null;
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
        this.count = null;
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
    this.verbCount = null;
    if (verb === null) {
        this.count = null;
    }
    this.events.emit("verb");
};

module.exports = ViKeys;

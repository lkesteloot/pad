// Copyright 2014 Lawrence Kesteloot

"use strict";

var events = require("events");
var util = require("util");
var trace = require("./trace");
var strings = require("./strings");
var AbstractKeys = require("./abstract_keys");

var ViKeys = function () {
    AbstractKeys.call(this);

    this.events = new events.EventEmitter();
    this.setCount(null);
    this.setMode(ViKeys.MODE_NORMAL);
    this.setVerb(null);
    this.setVerbCount(null);
};
util.inherits(ViKeys, AbstractKeys);

ViKeys.MODE_NORMAL = 0;
ViKeys.MODE_INSERT = 1;
ViKeys.MODE_REPLACE = 2;

var INDENT_SIZE = 4;

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
        case "$":
            pane.doc.deleteCharacters(pane.docIndex, pane.doc.findEndOfLine(pane.docIndex));
            if (this.verb === "c") {
                this.setMode(ViKeys.MODE_INSERT);
            }
            this.setVerb(null);
            break;

        case "0":
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

        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
            this.setVerbCount((this.verbCount || 0)*10 + (key.charCodeAt(0) - 48));
            break;

        case "b":
            docIndex = pane.doc.findPreviousWord(pane.docIndex, count);
            pane.doc.deleteCharacters(docIndex, pane.docIndex);
            pane.desiredDocIndex = docIndex;
            if (this.verb === "c") {
                this.setMode(ViKeys.MODE_INSERT);
            }
            this.setVerb(null);
            break;

        case "d":
            if (this.verb === "d") {
                docIndex = pane.doc.findStartOfLine(pane.docIndex);
                var endDocIndex = docIndex;
                for (var i = 0; i < count; i++) {
                    endDocIndex = pane.doc.findNextLine(endDocIndex);
                }
                pane.doc.deleteCharacters(docIndex, endDocIndex);
                pane.desiredDocIndex = docIndex;
            }
            this.setVerb(null);
            break;

        case "w":
            docIndex = pane.doc.findNextWord(pane.docIndex, count, this.verb === "c");
            pane.doc.deleteCharacters(pane.docIndex, docIndex);
            if (this.verb === "c") {
                this.setMode(ViKeys.MODE_INSERT);
            }
            this.setVerb(null);
            break;

        default:
            this.setVerb(null);
            break;
    }

    process.nextTick(callback);
};

ViKeys.prototype.handleUnverbedKey = function (key, pane, callback) {
    var count = this.count || 1;

    switch (key) {
        case "\x04": // ^D
            var lineCount = Math.ceil(pane.contentHeight/2);
            pane.cursorY += lineCount;
            pane.topY += lineCount;
            pane.redrawDirty = true;
            break;

        case "\x05": // ^E
            pane.topY += count;
            if (pane.cursorY < pane.topY) {
                pane.cursorY = pane.topY;
            }
            pane.redrawDirty = true;
            this.setCount(null);
            break;

        case "\x0A": // ^J
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

        case "\x0B": // ^K
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

        case "\x0C": // ^L
            pane.redrawDirty = true;
            break;

        case "\x0E": // ^N
        case "\x10": // ^P
            if (pane.rightPane !== null) {
                pane.rightPane.keys.onKey(key, pane.rightPane, callback);
                pane.rightPane.queueRedraw();
            }
            break;

        case "\x12": // ^R
            var docIndex = pane.doc.redo();
            if (docIndex !== null) {
                pane.desiredDocIndex = docIndex;
            }
            break;

        case "\x15": // ^U
            var lineCount = Math.ceil(pane.contentHeight/2);
            pane.cursorY -= lineCount;
            pane.topY -= lineCount;
            pane.redrawDirty = true;
            break;

        case "\x19": // ^Y
            pane.topY -= count;
            if (pane.topY < 0) {
                pane.topY = 0;
            }
            if (pane.cursorY > pane.topY + pane.contentHeight - 1) {
                pane.cursorY = pane.topY + pane.contentHeight - 1;
            }
            pane.redrawDirty = true;
            this.setCount(null);
            break;

        case "$":
            // XXX Not vi compatible: Here we should set the ideal X cursor position
            // to infinity.
            pane.desiredDocIndex = pane.doc.findEndOfLine(pane.docIndex);
            break;

        case "*":
            // Search for word under cursor.
            var wordInfo = pane.doc.findWordAt(pane.docIndex);
            if (wordInfo === null) {
                // XXX Error message.
            } else {
                var SearchPane = require("./search_pane");
                var searchPane = pane.openRightPane(SearchPane, true);
                searchPane.setSearchText("\\b" + wordInfo.text + "\\b");
            }
            break;

        case "/":
            // Require() this here to avoid circular dependency.
            var SearchPane = require("./search_pane");
            var searchPane = pane.openRightPane(SearchPane, true);
            break;

        case "0":
            if (this.count === null) {
                pane.desiredDocIndex = pane.doc.findStartOfLine(pane.docIndex);
            } else {
                this.setCount(this.count*10);
            }
            break;

        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
            this.setCount((this.count || 0)*10 + (key.charCodeAt(0) - 48));
            break;

        case ":":
        case ";":
            pane.window.activateCommandPane();
            break;

        case "G":
            if (this.count === null) {
                pane.cursorY = pane.layout.lines.length - 1;
            } else {
                pane.cursorY = this.count - 1;
                this.setCount(null);
            }
            break;

        case "X":
            if (count > pane.docIndex) {
                count = pane.docIndex;
            }
            if (count > 0) {
                pane.desiredDocIndex = pane.docIndex - count;
                pane.doc.deleteCharacters(pane.docIndex - count, pane.docIndex);
            }
            this.setCount(null);
            break;

        case "b":
            pane.desiredDocIndex = pane.doc.findPreviousWord(pane.docIndex, count);
            this.setCount(null);
            break;

        case "c":
            this.setVerb("c");
            break;

        case "d":
            this.setVerb("d");
            break;

        case "h":
            pane.cursorX -= count;
            this.setCount(null);
            break;

        case "i":
            this.setMode(ViKeys.MODE_INSERT);
            break;

        case "j":
        case "\x1B[B": // Down arrow.
            pane.cursorY += count;
            this.setCount(null);
            break;

        case "k":
        case "\x1B[A": // Up arrow.
            pane.cursorY -= count;
            this.setCount(null);
            break;

        case "l":
            pane.cursorX += count;
            this.setCount(null);
            break;

        case "o":
            var indent = this.getCurrentIndent(pane);
            // Find the beginning of the next line.
            var nextLineDocIndex = pane.doc.findNextLine(pane.docIndex);
            pane.doc.insertCharacters(nextLineDocIndex, indent + "\n");
            pane.desiredDocIndex = nextLineDocIndex + indent.length;
            this.setMode(ViKeys.MODE_INSERT);
            break;

        case "p":
            pane.window.nextPane();
            break;

        case "u":
            var docIndex = pane.doc.undo();
            if (docIndex !== null) {
                pane.desiredDocIndex = docIndex;
            }
            break;

        case "w":
            pane.desiredDocIndex = pane.doc.findNextWord(pane.docIndex, count, false);
            this.setCount(null);
            break;

        case "x":
            pane.doc.deleteCharacters(pane.docIndex, pane.docIndex + count);
            this.setCount(null);
            break;

        case "{":
            while (pane.cursorY > 0) {
                pane.cursorY--;
                if (pane.layout.lines[pane.cursorY].text.match(/^ *$/)) {
                    break;
                }
            }
            pane.cursorX = 0;
            break;

        case "}":
            while (pane.cursorY < pane.layout.lines.length - 1) {
                pane.cursorY++;
                if (pane.layout.lines[pane.cursorY].text.match(/^ *$/)) {
                    break;
                }
            }
            pane.cursorX = 0;
            break;

        case "\x1B[C": // Right arrow.
            pane.desiredDocIndex = pane.docIndex + 1;
            break;

        case "\x1B[D": // Left arrow.
            pane.desiredDocIndex = pane.docIndex - 1;
            break;

        default:
            // Ignore.
            break;
    }

    process.nextTick(callback);
};

ViKeys.prototype.handleInsertKey = function (key, pane, callback) {
    if (key === "\x1B") { // ESC
        // Exit insert mode.
        this.setMode(ViKeys.MODE_NORMAL);
        // XXX Look at this.count and repeat the insert that many times.
        this.setCount(null);
    } else if (key == "\x08" || key == "\x7F") {
        if (pane.docIndex > 0) {
            pane.desiredDocIndex = pane.docIndex - 1;
            pane.doc.deleteCharacters(pane.docIndex - 1);
        }
    } else if (key.substring(0, 2) === "\x1B[") {
        // Control sequences.
        switch (key) {
            case "\x1B[Z": // Shift-Tab.
                // Back up to the previous tab stop.
                var offset = pane.docIndex - pane.doc.findStartOfLine(pane.docIndex);
                if (offset > 0) {
                    var count = (offset - 1) % 4 + 1;
                    pane.desiredDocIndex = pane.docIndex - count;
                    pane.doc.deleteCharacters(pane.docIndex - count, pane.docIndex);
                }
                break;

            case "\x1B[A": // Up arrow.
                pane.cursorY--;
                break;

            case "\x1B[B": // Down arrow.
                pane.cursorY++;
                break;

            case "\x1B[C": // Right arrow.
                pane.desiredDocIndex = pane.docIndex + 1;
                break;

            case "\x1B[D": // Left arrow.
                pane.desiredDocIndex = pane.docIndex - 1;
                break;

            default:
                // Ignore.
                break;
        }
    } else if (key < " " && (key != "\r" && key != "\n" && key != "\t")) {
        // Ignore control keys.
    } else {
        var text;
        if (key === "\r" || key === "\n") {
            // Insert new line.
            text = "\n" + this.getCurrentIndent(pane);
        } else if (key === "\t") {
            // Fake tab.
            var offset = pane.docIndex - pane.doc.findStartOfLine(pane.docIndex);
            text = strings.repeat(" ", INDENT_SIZE - offset % INDENT_SIZE);
        } else {
            text = key;
        }
        pane.desiredDocIndex = pane.docIndex + text.length;
        pane.doc.insertCharacters(pane.docIndex, text);
    }

    process.nextTick(callback);
};

/**
 * Return the indent of the current line, as a string. This includes
 * spaces and tabs.
 */
ViKeys.prototype.getCurrentIndent = function (pane) {
    var text = pane.getCurrentLine();
    return text.match(/^[ \t]*/)[0];
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

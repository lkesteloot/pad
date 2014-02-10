// Copyright 2014 Lawrence Kesteloot

"use strict";

var events = require("events");
var trace = require("./trace");

var ViKeys = function () {
    this.count = undefined;
    this.events = new events.EventEmitter();
    this.setMode(ViKeys.MODE_NORMAL);
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
            pane.cursorX = 99999;
            break;

        case 48: // "0"
            if (this.count === undefined) {
                pane.cursorX = 0;
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
            if (this.count === undefined) {
                this.count = 0;
            }
            this.count = this.count*10 + (key - 48);
            break;

        case 58: ":"
        case 59: ";"
            setTimeout(function () {
                pane.window.activateStatusPane();
            }, 0);
            break;

        case 71: // "G"
            if (this.count === undefined) {
                pane.cursorY = pane.layout.lines.length - 1;
            } else {
                pane.cursorY = this.count - 1;
                this.count = undefined;
            }
            break;

        case 88: // "X"
            pane.backspaceCharacter();
            break;

        case 104: // "h"
            pane.cursorX -= (this.count || 1);
            this.count = undefined;
            break;

        case 105: // "i"
            this.setMode(ViKeys.MODE_INSERT);
            break;

        case 106: // "j"
            pane.cursorY += (this.count || 1);
            this.count = undefined;
            break;

        case 107: // "k"
            pane.cursorY -= (this.count || 1);
            this.count = undefined;
            break;

        case 108: // "l"
            pane.cursorX += (this.count || 1);
            this.count = undefined;
            break;

        case 112: // "p":
            setTimeout(function () {
                pane.window.nextPane();
            }, 0);
            break;

        case 113: // "q"
            // Need to wait until the rest of our code runs, which would put the cursor right
            // back where it belongs.
            setTimeout(function () {
                pane.window.shutdown();
            }, 0);
            break;

        case 119: // "w"
            pane.saveFile(callback);
            return;

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
        this.count = undefined;
    } else if (key == 8 || key == 127) {
        pane.backspaceCharacter();
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

module.exports = ViKeys;

// Copyright 2014 Lawrence Kesteloot

var MODE_NORMAL = 0;
var MODE_INSERT = 1;
var MODE_REPLACE = 2;

var ViKeys = function () {
    this.count = undefined;
    this.mode = MODE_NORMAL;
};

ViKeys.prototype.onKey = function (key, pane) {
    switch (this.mode) {
        case MODE_NORMAL:
            this.handleNormalKey(key, pane);
            break;

        case MODE_INSERT:
            this.handleInsertKey(key, pane);
            break;
    }
};

ViKeys.prototype.handleNormalKey = function (key, pane) {
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

        case 71: // "G"
            if (this.count === undefined) {
                pane.cursorY = pane.layout.lines.length - 1;
            } else {
                pane.cursorY = this.count - 1;
                this.count = undefined;
            }
            break;

        case 104: // "h"
            pane.cursorX -= (this.count || 1);
            this.count = undefined;
            break;

        case 105: // "i"
            this.mode = MODE_INSERT;
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

        case 113: // "q"
            require("./window").events.emit("shutdown");
            break;

        case 119: // "w"
            pane.saveFile();
            break;

        default:
            // Ignore.
            break;
    }
};

ViKeys.prototype.handleInsertKey = function (key, pane) {
    if (key === 27) {
        // Exit insert mode.
        this.mode = MODE_NORMAL;
        // XXX Look at this.count and repeat the insert that many times.
        this.count = undefined;
    } else if (key == 8 || key == 127) {
        pane.backspaceCharacter();
    } else {
        pane.insertCharacter(String.fromCharCode(key));
    }
};

module.exports = ViKeys;

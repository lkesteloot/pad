// Copyright 2014 Lawrence Kesteloot

var ViKeys = function () {
    this.count = undefined;
};

ViKeys.prototype.onKey = function (key, pane) {
    switch (key) {
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

        case 104: // "h"
            pane.cursorX -= (this.count || 1);
            this.count = undefined;
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

        case 71: // "G"
            if (this.count === undefined) {
                pane.cursorY = pane.layout.lines.length - 1;
            } else {
                pane.cursorY = this.count - 1;
                this.count = undefined;
            }
            break;

        default:
            // Ignore.
            break;
    }
};

module.exports = ViKeys;

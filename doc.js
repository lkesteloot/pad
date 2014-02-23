// Copyright 2014 Lawrence Kesteloot

"use strict";

var fs = require("fs");
var events = require("events");
var trace = require("./trace");

var Doc = function () {
    this.events = new events.EventEmitter();
    this.setString("", false);
};

Doc.prototype.getLength = function () {
    return this.buffer.length;
};

Doc.prototype.isModified = function () {
    return this.savedAt !== this.undoStack.length;
};

Doc.prototype.setString = function (s, emitEvent) {
    this.buffer = new Buffer(s);
    this.filename = "";
    this.undoStack = [];
    this.redoStack = [];
    this.savedAt = 0;
    if (emitEvent !== false) {
        this.events.emit("change");
    }
};

Doc.prototype.toString = function (start, end) {
    return this.buffer.toString("utf8", start, end);
};

Doc.prototype.charAt = function (index) {
    return this.toString(index, index + 1);
};

Doc.prototype.getCharacterTypeAt = function (index) {
    return getCharacterType(this.charAt(index));
};

Doc.prototype.readFile = function (filename, callback) {
    fs.readFile(filename, function (err, contents) {
        if (err) {
            callback(err);
        } else {
            this.setString(contents.toString(), false);
            this.filename = filename;
            callback();
        }
    }.bind(this));
};

Doc.prototype.saveFile = function (callback) {
    fs.writeFile(this.filename, this.buffer, {
        encoding: "utf8"
    }, function (err) {
        if (err) {
            callback(err);
        } else {
            this.savedAt = this.undoStack.length;
            this.events.emit("modified");
            callback();
        }
    }.bind(this));
};

Doc.prototype.insertCharacters = function (index, s) {
    var change = {
        forward: function () {
            this.buffer = Buffer.concat([
                this.buffer.slice(0, index),
                new Buffer(s),
                this.buffer.slice(index)]);
            return index + s.length;
        }.bind(this),
        reverse: function () {
            this.buffer = Buffer.concat([
                this.buffer.slice(0, index),
                this.buffer.slice(index + s.length)]);
            return index;
        }.bind(this)
    };

    this.undoStack.push(change);
    this.redoStack = [];
    change.forward();
    this.events.emit("change");
};

/**
 * Deletes from fromIndex (inclusive) to toIndex (exclusive). If
 * toIndex is missing, one character is deleted.
 */
Doc.prototype.deleteCharacters = function (fromIndex, toIndex) {
    if (toIndex === undefined) {
        toIndex = fromIndex + 1;
    }
    var removedText = this.toString(fromIndex, toIndex);

    var change = {
        forward: function () {
            this.buffer = Buffer.concat([
                this.buffer.slice(0, fromIndex),
                this.buffer.slice(toIndex)]);
            return fromIndex;
        }.bind(this),
        reverse: function () {
            this.buffer = Buffer.concat([
                this.buffer.slice(0, fromIndex),
                new Buffer(removedText),
                this.buffer.slice(fromIndex)]);
            return fromIndex;
        }.bind(this)
    };

    this.undoStack.push(change);
    this.redoStack = [];
    change.forward();
    this.events.emit("change");
};

Doc.prototype.undo = function () {
    var docIndex = null;

    if (this.undoStack.length > 0) {
        var change = this.undoStack.pop();
        docIndex = change.reverse();
        this.redoStack.push(change);
        this.events.emit("change");
    }

    return docIndex;
};

Doc.prototype.redo = function () {
    var docIndex = null;

    if (this.redoStack.length > 0) {
        var change = this.redoStack.pop();
        docIndex = change.forward();
        this.undoStack.push(change);
        this.events.emit("change");
    }

    return docIndex;
};

/**
 * Return the index of the first character on the next line.
 */
Doc.prototype.findNextLine = function (index) {
    while (index < this.getLength()) {
        if (this.buffer[index] === 10) {
            return index + 1;
        }
        index++;
    }

    // Off the end.
    return index;
};

/**
 * Return the index of the first character of this line.
 */
Doc.prototype.findStartOfLine = function (index) {
    while (index > 0 && this.buffer[index - 1] !== 10) {
        index--;
    }

    return index;
};

/**
 * Return the index of the end of line character of this line, including the
 * one at index. At the end of the file, returns the index one past the end.
 */
Doc.prototype.findEndOfLine = function (index) {
    while (index < this.getLength() && this.buffer[index] !== 10) {
        index++;
    }

    return index;
};

/**
 * Return the word at the specified location, or null if the location is
 * not on a word. The object returned has:
 *
 *     text: word under cursor.
 *     start: start index.
 *     end: end index (exclusive).
 */
Doc.prototype.findWordAt = function (index) {
    var type = this.getCharacterTypeAt(index);
    if (type !== CHARACTER_TYPE_WORD) {
        // Not on a word.
        return null;
    }

    var start = index;
    var end = index;

    // Find start.
    while (start > 0 && this.getCharacterTypeAt(start - 1) == CHARACTER_TYPE_WORD) {
        start--;
    }

    // Find end.
    while (end < this.getLength() && this.getCharacterTypeAt(end) == CHARACTER_TYPE_WORD) {
        end++;
    }

    return {
        text: this.toString(start, end),
        start: start,
        end: end
    };
};

/**
 * Return the next of the next (count) words. If stopAtSpace is true,
 * will not go past the first space it sees if it wasn't already
 * on a space. This is for the "change word" command, which behaves
 * differently than the other word motions.
 */
Doc.prototype.findNextWord = function (index, count, stopAtSpace) {
    var maxIndex = this.getLength() - 1;

    var originalType = null;
    for (var i = 0; i < count && index < maxIndex; i++) {
        // Forward one word.
        var previousType = null;
        while (index < maxIndex) {
            var type = this.getCharacterTypeAt(index);
            if (originalType === null) {
                originalType = type;
            }
            if (previousType === null || type === previousType) {
                // Same, keep going.
            } else if (type === CHARACTER_TYPE_SPACE) {
                // Space, keep going, unless we need to stop at a space.
                if (stopAtSpace && originalType !== CHARACTER_TYPE_SPACE && i == count - 1) {
                    break;
                }
            } else {
                // Stop.
                break;
            }
            previousType = type;
            index++;
        }
    }

    return index;
};

/**
 * Return the index of the previous (count) words.
 */
Doc.prototype.findPreviousWord = function (index, count) {
    for (var i = 0; i < count && index > 0; i++) {
        // Reverse one word.
        var previousType = null;
        while (index > 0) {
            var type = this.getCharacterTypeAt(index - 1);
            if (previousType === null || type === previousType) {
                // Same, keep going.
            } else if (previousType === CHARACTER_TYPE_SPACE) {
                // On space, keep going.
            } else {
                // Start of word or symbol, stop.
                break;
            }
            previousType = type;
            index--;
        }
    }

    return index;
};

/**
 * CHARACTER_TYPE_WORD = word, CHARACTER_TYPE_SYMBOL = symbol, CHARACTER_TYPE_SPACE = whitespace.
 */
var CHARACTER_TYPE_WORD = 0;
var CHARACTER_TYPE_SYMBOL = 1;
var CHARACTER_TYPE_SPACE = 2;
var getCharacterType = function (ch) {
    if (ch === " " || ch === "\n" || ch === "\r" || ch === "\t") {
        return CHARACTER_TYPE_SPACE;
    } else if ((ch >= "A" && ch <= "Z") || (ch >= "a" && ch <= "z") || (ch >= "0" && ch <= "9")) {
        return CHARACTER_TYPE_WORD;
    } else {
        // Everything else is a symbol.
        return CHARACTER_TYPE_SYMBOL;
    }
};

module.exports = Doc;

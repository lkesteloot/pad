// Copyright 2014 Lawrence Kesteloot

"use strict";

var fs = require("fs");
var events = require("events");
var trace = require("./trace");

var Doc = function () {
    this.buffer = new Buffer(0);
    this.filename = "";
    this.modified = false;
    this.events = new events.EventEmitter();
};

Doc.prototype.getLength = function () {
    return this.buffer.length;
};

Doc.prototype.setString = function (s) {
    this.buffer = new Buffer(s);
    this.filename = "";
    this.modified = false;
    this.events.emit("change");
};

Doc.prototype.toString = function () {
    return this.buffer.toString();
};

Doc.prototype.charAt = function (index) {
    return this.buffer.toString("utf8", index, index + 1);
};

Doc.prototype.readFile = function (filename, callback) {
    fs.readFile(filename, function (err, contents) {
        if (err) {
            callback(err);
        } else {
            this.buffer = contents;
            this.filename = filename;
            this.modified = false;
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
            this.modified = false;
            this.events.emit("modified");
            callback();
        }
    }.bind(this));
};

Doc.prototype.insertCharacter = function (index, ch) {
    this.buffer = Buffer.concat([
        this.buffer.slice(0, index),
        new Buffer(ch),
        this.buffer.slice(index)], this.buffer.length + 1);
    this.events.emit("change");
    this.modified = true;
};

/**
 * Deletes from fromIndex (inclusive) to toIndex (exclusive). If
 * toIndex is missing, one character is deleted.
 */
Doc.prototype.deleteCharacters = function (fromIndex, toIndex) {
    if (toIndex === undefined) {
        toIndex = fromIndex + 1;
    }

    this.buffer = Buffer.concat([
        this.buffer.slice(0, fromIndex),
        this.buffer.slice(toIndex)]);
    this.events.emit("change");
    this.modified = true;
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
            var ch = this.charAt(index);
            var type = getCharacterType(ch);
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
            var ch = this.charAt(index - 1);
            var type = getCharacterType(ch);
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

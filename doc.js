// Copyright 2014 Lawrence Kesteloot

var fs = require("fs");
var trace = require("./trace");

var Doc = function () {
    this.buffer = new Buffer(0);
    this.modified = false;
};

Doc.prototype.readFile = function (filename, callback) {
    var self = this;

    fs.readFile(filename, function (err, contents) {
        if (err) {
            callback(err);
        } else {
            self.buffer = contents;
            self.modified = false;
            callback();
        }
    });
};

Doc.prototype.saveFile = function (filename, callback) {
    var self = this;

    fs.writeFile(filename, this.buffer, {
        encoding: "utf8"
    }, function (err) {
        if (err) {
            callback(err);
        } else {
            self.modified = false;
            callback();
        }
    });
};

Doc.prototype.insertCharacter = function (index, ch) {
    this.buffer = Buffer.concat([
        this.buffer.slice(0, index),
        new Buffer(ch),
        this.buffer.slice(index)], this.buffer.length + 1);
    this.modified = true;
};

Doc.prototype.deleteCharacter = function (index) {
    this.buffer = Buffer.concat([
        this.buffer.slice(0, index),
        this.buffer.slice(index + 1)], this.buffer.length - 1);
    this.modified = true;
};

Doc.prototype.setLine = function (lineNumber, text) {
    if (this.lines[lineNumber] !== text) {
        this.lines[lineNumber] = text;
        this.modified = true;
    }
};

Doc.prototype.insertLine = function (lineNumber) {
    this.lines.splice(lineNumber, 0, "");
    this.modified = true;
};

// Merge the specified line with the next one.
Doc.prototype.mergeLines = function (lineNumber) {
    if (lineNumber < this.lines.length - 1) {
        this.lines[lineNumber] += this.lines[lineNumber + 1];
        this.lines.splice(lineNumber + 1, 1);
        this.modified = true;
    }
};

module.exports = Doc;

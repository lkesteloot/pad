// Copyright 2014 Lawrence Kesteloot

var fs = require("fs");
var trace = require("./trace");

var Buffer = function () {
    this.lines = [];
    this.modified = false;
};

Buffer.prototype.readFile = function (filename, callback) {
    var self = this;

    fs.readFile(filename, {
        encoding: "utf8"
    }, function (err, contents) {
        if (err) {
            callback(err);
        } else {
            self._parseFile(contents);
            callback();
        }
    });
};

Buffer.prototype.saveFile = function (filename, callback) {
    var self = this;

    var data = this.lines.join("\n") + "\n";
    fs.writeFile(filename, data, {
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

Buffer.prototype.setLine = function (lineNumber, text) {
    if (this.lines[lineNumber] !== text) {
        this.lines[lineNumber] = text;
        this.modified = true;
    }
};

// Merge the specified line with the next one.
Buffer.prototype.mergeLines = function (lineNumber) {
    if (lineNumber < this.lines.length - 1) {
        this.lines[lineNumber] += this.lines[lineNumber + 1];
        this.lines.splice(lineNumber + 1, 1);
        this.modified = true;
    }
};

Buffer.prototype._parseFile = function (contents) {
    // Strip trailing \n.
    if (contents.length > 0 && contents.substring(contents.length - 1) === "\n") {
        contents = contents.substring(0, contents.length - 1);
    }

    this.lines = contents.split("\n");
    this.modified = false;
};

module.exports = Buffer;


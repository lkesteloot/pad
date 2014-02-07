// Copyright 2014 Lawrence Kesteloot

var fs = require("fs");
var trace = require("./trace");

var Doc = function () {
    this.lines = [];
    this.modified = false;
};

Doc.prototype.readFile = function (filename, callback) {
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

Doc.prototype.saveFile = function (filename, callback) {
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

Doc.prototype._parseFile = function (contents) {
    // Strip trailing \n.
    if (contents.length > 0 && contents.substring(contents.length - 1) === "\n") {
        contents = contents.substring(0, contents.length - 1);
    }

    this.lines = contents.split("\n");
    this.modified = false;
};

module.exports = Doc;


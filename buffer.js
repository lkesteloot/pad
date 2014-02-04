// Copyright 2014 Lawrence Kesteloot

var fs = require("fs");

var Buffer = function () {
    this.lines = [];
};

Buffer.prototype.readFile = function (filename, successCallback, errorCallback) {
    var self = this;

    fs.readFile(filename, {
        encoding: "UTF-8"
    }, function (err, contents) {
        if (err) {
            errorCallback(err);
        } else {
            self._parseFile(contents, successCallback);
        }
    });
};

Buffer.prototype._parseFile = function (contents, callback) {
    // Strip trailing \n.
    if (contents.length > 0 && contents.substring(contents.length - 1) === "\n") {
        contents = contents.substring(0, contents.length - 1);
    }

    this.lines = contents.split("\n");
    callback();
};

exports.Buffer = Buffer;


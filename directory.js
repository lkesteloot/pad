// Copyright 2014 Lawrence Kesteloot

"use strict";

var fs = require("fs");
var path = require("path");
var trace = require("./trace");
var strings = require("./strings");

var IGNORED_DIRECTORIES = {
    ".git": true,
    ".svn": true,
    "node_modules": true,
};

var Directory = function (pathname) {
    this.pathname = path.resolve(pathname);
    this.entries = {};
    this.err = null;
};

Directory.prototype.populate = function (callback) {
    this.entries = {};
    this.err = null;

    fs.readdir(this.pathname, function (err, filenames) {
        if (err) {
            this.err = err;
            if (callback) {
                callback();
            }
        } else {
            var count = filenames.length;
            if (count === 0) {
                if (callback) {
                    callback();
                }
            } else {
                var doneProcessingFilename = function () {
                    count--;
                    if (count === 0) {
                        if (callback) {
                            callback();
                        }
                    }
                };

                filenames.forEach(function (filename) {
                    var pathname = path.join(this.pathname, filename);
                    fs.stat(pathname, function (err, stats) {
                        if (err) {
                            trace.log("Got error stat(" + pathname + "): " + err);
                            doneProcessingFilename();
                        } else if (stats.isDirectory()) {
                            // Recurse.
                            if (IGNORED_DIRECTORIES.hasOwnProperty(filename)) {
                                doneProcessingFilename();
                            } else {
                                this.entries[filename] = new Directory(pathname);
                                this.entries[filename].populate(doneProcessingFilename);
                            }
                        } else if (stats.isFile()) {
                            // We'll populate with Doc later.
                            this.entries[filename] = null;
                            doneProcessingFilename();
                        } else {
                            // Ignore.
                            trace.log("Ignoring file " + pathname);
                            doneProcessingFilename();
                        }
                    }.bind(this));
                }.bind(this));
            }
        }
    }.bind(this));
};

Directory.prototype.print = function (indent) {
    indent = indent || 0;

    var filenames = Object.keys(this.entries);
    filenames.sort();

    filenames.forEach(function (filename) {
        var value = this.entries[filename];
        console.log(strings.repeat("    ", indent) + filename);
        if (value instanceof Directory) {
            value.print(indent + 1);
        }
    }.bind(this));
};

module.exports = Directory;

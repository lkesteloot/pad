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

Doc.prototype.charAt = function (docIndex) {
    return this.buffer.toString("utf8", docIndex, docIndex + 1);
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

Doc.prototype.deleteCharacter = function (index) {
    this.buffer = Buffer.concat([
        this.buffer.slice(0, index),
        this.buffer.slice(index + 1)], this.buffer.length - 1);
    this.events.emit("change");
    this.modified = true;
};

/**
 * Return the index of the first character on the next line.
 */
Doc.prototype.nextLine = function (index) {
    while (index < this.getLength()) {
        if (this.buffer[index] === 10) {
            return index + 1;
        }
        index++;
    }

    // Off the end.
    return index;
};

module.exports = Doc;

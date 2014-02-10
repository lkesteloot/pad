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
    var self = this;

    fs.writeFile(this.filename, this.buffer, {
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
    this.events.emit("modified");
    this.modified = true;
};

Doc.prototype.deleteCharacter = function (index) {
    this.buffer = Buffer.concat([
        this.buffer.slice(0, index),
        this.buffer.slice(index + 1)], this.buffer.length - 1);
    this.events.emit("modified");
    this.modified = true;
};

module.exports = Doc;

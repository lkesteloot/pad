// Copyright 2014 Lawrence Kesteloot

"use strict";

var util = require("util");
var Pane = require("./pane");
var SearchKeys = require("./search_keys");
var trace = require("./trace");
var Line = require("./line");
var Fragment = require("./fragment");
var term = require("./term");

// Subclass of Pane.
var SearchPane = function (window, x, y, width, height) {
    Pane.call(this, window, x, y, width, height);

    this.keys = new SearchKeys();
};
util.inherits(SearchPane, Pane);

// Override.
SearchPane.prototype.format = function () {
    var lines = [];

    var endOfLine = this.doc.findEndOfLine(0);
    var searchText = this.doc.toString(0, endOfLine);

    lines.push(new Line(searchText, 0, true, 0));
    lines.push(new Line("", 0, true, null));

    var doc = this.mainPane.doc;
    var text = doc.toString();
    var re = new RegExp(searchText, "mg");

    var match;
    var lastStart = -1;
    while ((match = re.exec(text)) !== null) {
        var word = match[0];
        trace.log("Matched: <" + word + ">");
        var start = match.index;
        if (start === lastStart) {
            // Not making forward progress.
            break;
        }
        var end = start + word.length;
        var before = Math.max(start - 5, doc.findStartOfLine(start));
        var after = Math.min(end + 5, doc.findEndOfLine(start));
        after = Math.min(after, this.contentWidth + before);
        var extract = doc.toString(before, after);
        trace.log("Extract: <" + extract + ">");
        var line = new Line(extract, 0, true, null);
        trace.log(before + " " + start + " " + end + " " + after);
        if (start > before) {
            line.addFragment(new Fragment(0, start - before, term.dim));
        }
        line.addFragment(new Fragment(start - before, end - before, term.defaultColor));
        if (after > end) {
            line.addFragment(new Fragment(end - before, after - before, term.dim));
        }
        lines.push(line);
        lastStart = start;
    }

    this.layout.lines = lines;
};

module.exports = SearchPane;

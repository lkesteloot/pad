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
    var re;
    try {
        re = new RegExp(searchText, "mg");
    } catch (e) {
        // Syntax error.
        re = null;
    }

    var match;
    var lastStart = -1;
    while (re !== null && (match = re.exec(text)) !== null) {
        var word = match[0];
        if (word === "") {
            // Not matching anything. This isn't good, we won't make
            // any forward progress and it's not useful to the user.
            break;
        }

        // Find doc index of match.
        var start = match.index;
        if (start === lastStart) {
            // Not making forward progress. This can happen when the search
            // string is empty or allows empty matches, such as "a*". I don't
            // think this can happen since we check for word === "" above,
            // but I'm leaving this in just in case, since it would result in
            // an infinite loop.
            break;
        }
        var end = start + word.length;

        // Find doc index of context around match. We want to align the matches
        // vertically, but also have them more or less centered. Assume that the
        // length of the search string is about the length of the matched word.
        var context = Math.floor((this.contentWidth - searchText.length)/2);
        var before = Math.max(start - context, doc.findStartOfLine(start));
        var after = Math.min(doc.findEndOfLine(start), before + this.contentWidth);

        // Get what we want to show and highlight it.
        var extract = doc.toString(before, after);
        var line = new Line(extract, 0, true, null);
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

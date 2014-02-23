// Copyright 2014 Lawrence Kesteloot

"use strict";

var util = require("util");
var Pane = require("./pane");
var SearchKeys = require("./search_keys");
var trace = require("./trace");
var Line = require("./line");
var Fragment = require("./fragment");
var term = require("./term");
var Attr = require("./attr");

// Subclass of Pane.
var SearchPane = function (window, x, y, width, height, mainPane) {
    Pane.call(this, window, x, y, width, height, mainPane);

    this.keys = new SearchKeys();
    this.hits = [];
    this.selected = 0;
    this.origDocIndex = mainPane.docIndex;
    this.previousSearchText = null;
    mainPane.events.on("format", this.onMainPaneFormat.bind(this));
};
util.inherits(SearchPane, Pane);

SearchPane.prototype.setSearchText = function (searchText) {
    this.doc.setString(searchText);
};

SearchPane.prototype.setSelected = function (selected) {
    this.selected = selected;

    if (this.selected >= 0 && this.selected < this.hits.length) {
        var hit = this.hits[this.selected];
        this.mainPane.desiredDocIndex = hit.start;
        this.highlightMainPane();
    }

    this.layoutDirty = true;
};

// Override.
SearchPane.prototype.format = function () {
    var lines = [];

    var endOfLine = this.doc.findEndOfLine(0);
    var searchText = this.doc.toString(0, endOfLine);
    var searchTextChanged = searchText != this.previousSearchText;
    this.previousSearchText = searchText;

    this.hits = performSearch(this.mainPane.doc, searchText);
    if (this.selected > this.hits.length - 1) {
        this.selected = this.hits.length - 1;
    }
    if (this.selected < 0) {
        this.selected = 0;
    }

    // If main pane's cursor isn't at a search hit, move it to the next search hit.
    if (searchTextChanged) {
        var preferredHit = null;
        var docIndex = this.origDocIndex;
        for (var i = 0; i < this.hits.length; i++) {
            var hit = this.hits[i];
            if (hit.start === docIndex) {
                // Already at hit. Leave it.
                this.selected = i;
                break;
            } else if (preferredHit === null && hit.start > docIndex) {
                // First hit after cursor. Jump to it.
                this.selected = i;
                this.mainPane.desiredDocIndex = hit.start;
                break;
            }
        }
    }

    lines.push(new Line(searchText, 0, true, 0));
    lines.push(new Line("", 0, true, null));

    for (var i = 0; i < this.hits.length; i++) {
        var hit = this.hits[i];

        // Find doc index of context around match. We want to align the matches
        // vertically, but also have them more or less centered. Assume that the
        // length of the search string is about the length of the matched word.
        var context = Math.floor((this.contentWidth - searchText.length)/2);
        var before = Math.max(hit.start - context, hit.doc.findStartOfLine(hit.start));
        var after = Math.min(hit.doc.findEndOfLine(hit.start), before + this.contentWidth);

        // Get what we want to show and highlight it.
        var extract = hit.doc.toString(before, after);
        var line = new Line(extract, 0, true, null);

        var category = Line.SYNTAX_CATEGORY;
        var normalAttr;
        var highlightAttr;
        if (i === this.selected) {
            normalAttr = Attr.DIM_HIGHLIGHT;
            highlightAttr = Attr.HIGHLIGHT;
        } else {
            normalAttr = Attr.DIM;
            highlightAttr = Attr.NORMAL;
        }

        if (hit.start > before) {
            line.addFragment(category, new Fragment(0, hit.start - before, normalAttr));
        }
        line.addFragment(category, new Fragment(hit.start - before, hit.end - before, highlightAttr));
        if (after > hit.end) {
            line.addFragment(category, new Fragment(hit.end - before, after - before, normalAttr));
        }
        lines.push(line);
    }

    // Highlight main pane.
    this.highlightMainPane();

    this.layout.lines = lines;
};

SearchPane.prototype.onMainPaneFormat = function () {
    this.highlightMainPane();
};

SearchPane.prototype.highlightMainPane = function () {
    var hitIndex = 0;
    this.mainPane.layout.lines.forEach(function (line) {
        line.clearFragments(Line.SEARCH_CATEGORY);
        if (line.docIndex === null) {
            // Not from a doc.
            return;
        }

        var lineStart = line.docIndex;
        var lineEnd = lineStart + line.text.length;

        // Find the hit for this line.
        while (hitIndex < this.hits.length && this.hits[hitIndex].end <= lineStart) {
            hitIndex++;
        }

        // Go through all hits, highlighting this line.
        for (var i = hitIndex; i < this.hits.length; i++) {
            var hit = this.hits[i];
            if (hit.start >= lineEnd) {
                // No more hits apply to this line.
                break;
            }

            var start = Math.max(hit.start - lineStart, 0);
            var end = Math.min(hit.end - lineStart, line.text.length);
            var attr = i === this.selected ? Attr.HIGHLIGHT : Attr.DIM_HIGHLIGHT;

            line.addFragment(Line.SEARCH_CATEGORY, new Fragment(start, end, attr));
        }
    }.bind(this));

    this.mainPane.redrawDirty = true;
    this.mainPane.queueRedraw();
    trace.log("highlightMainPane");
};

/**
 * Returns an array of hits, each of which is an object with:
 *
 *     doc: Document
 *     start: Doc index where hit starts.
 *     end: Doc index where hit ends.
 */
var performSearch = function (doc, searchText) {
    var text = doc.toString();

    var re;
    try {
        re = new RegExp(searchText, "mg");
    } catch (e) {
        // Syntax error.
        return [];
    }

    var match;
    var lastStart = -1;
    var hits = [];
    while ((match = re.exec(text)) !== null) {
        var word = match[0];
        if (word === "") {
            // Not matching anything. This isn't good, we won't make
            // any forward progress and it's not useful to the user.
            // XXX Will this trigger when we search for ^$ and hit
            // an empty line?
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

        hits.push({
            doc: doc,
            start: start,
            end: end
        });

        lastStart = start;
    }

    return hits;
};

module.exports = SearchPane;

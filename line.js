// Copyright 2014 Lawrence Kesteloot

"use strict";

var term = require("./term");
var strings = require("./strings");
var Fragment = require("./fragment");
var Attr = require("./attr");
var trace = require("./trace");

var Line = function (text, indent, hasEol, docIndex) {
    this.text = text;
    this.indent = indent;
    this.hasEol = hasEol;
    this.docIndex = docIndex;
    this.fragments = null;
    this.categories = {};

    // Owned by the pane, for any extra data it wants.
    this.misc = null;
};

Line.SYNTAX_CATEGORY = "10-Syntax";
Line.SEARCH_CATEGORY = "50-Search";

Line.prototype.addFragment = function (category, fragment) {
    if (!this.categories.hasOwnProperty(category)) {
        this.categories[category] = [];
    }
    this.categories[category].push(fragment);

    // Invalidate cache.
    this.fragments = null;
};

Line.prototype.clearFragments = function (category) {
    delete this.categories[category];

    // Invalidate cache.
    this.fragments = null;
};

Line.prototype.drawLine = function (width) {
    if (this.indent) {
        var indent = strings.repeat(".", this.indent);
        term.sgr(90);
        term.write(indent);
    }

    if (this.fragments === null) {
        this.computeFragments();
    }

    for (var i = 0; i < this.fragments.length; i++) {
        var fragment = this.fragments[i];
        fragment.attr.apply();
        term.write(this.text.substring(fragment.start, fragment.end));
    }

    term.reset();
    term.clearChars(width - this.text.length - this.indent);
};

Line.prototype.computeFragments = function () {
    // Put all the fragments into an array of starts and ends.
    var points = [];
    var addFragmentPoints = function (category, fragment) {
        points.push({
            type: "start",
            category: category,
            location: fragment.start,
            attr: fragment.attr
        });
        points.push({
            type: "end",
            category: category,
            location: fragment.end
        });
    };
    addFragmentPoints("00-Base", new Fragment(0, this.text.length, Attr.NORMAL));
    for (var category in this.categories) {
        var fragments = this.categories[category];
        fragments.forEach(function (fragment) {
            addFragmentPoints(category, fragment);
        });
    }

    // Sort those (first by location, then end-before-start).
    points.sort(function (a, b) {
        // Primary sort by location.
        var cmp = a.location - b.location;
        if (cmp !== 0) {
            return cmp;
        }

        // For same location, put "end" before "start". This only matters for
        // those within the same category.
        if (a.type !== b.type) {
            if (a.type === "end") {
                return -1;
            } else {
                return 1;
            }
        }

        return 0;
    });

    // Walk through points, keep track of all active attributes.
    var attrs = {};
    var lastLocation = 0;
    this.fragments = [];
    points.forEach(function (point) {
        if (point.location != lastLocation) {
            var attr = Attr.collapse(attrs);
            this.fragments.push(new Fragment(lastLocation, point.location, attr));

            lastLocation = point.location;
        }

        if (point.type === "start") {
            attrs[point.category] = point;
        } else {
            delete attrs[point.category];
        }
    }.bind(this));
};

Line.prototype.getPrefixLength = function () {
    return this.indent;
};

module.exports = Line;

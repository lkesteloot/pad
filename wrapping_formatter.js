// Copyright 2014 Lawrence Kesteloot

"use strict";

var Line = require("./line");
var Fragment = require("./fragment");
var trace = require("./trace");
var term = require("./term");
var strings = require("./strings");
var Attr = require("./attr");

var JAVASCRIPT_KEYWORDS = {
    "break": 0,
    "case": 0,
    "catch": 0,
    "continue": 0,
    "debugger": 0,
    "default": 0,
    "delete": 0,
    "do": 0,
    "else": 0,
    "finally": 0,
    "for": 0,
    "function": 0,
    "if": 0,
    "in": 0,
    "instanceof": 0,
    "new": 0,
    "return": 0,
    "switch": 0,
    "this": 0,
    "throw": 0,
    "try": 0,
    "typeof": 0,
    "var": 0,
    "void": 0,
    "while": 0,
    "with": 0,
};
var VISIBLE_TAB = "\u2192";

var WrappingFormatter = function (wrapWidth) {
    this.wrapWidth = wrapWidth;
};

WrappingFormatter.prototype.format = function (doc, layout) {
    var lines = [];
    var buffer = doc.buffer;

    // Add a display line.
    var addLine = function (start, end, indent, hasEol) {
        var text = buffer.toString("utf8", start, end);

        // Replace tabs with arrow.
        var index;
        var fragments = [];
        while ((index = text.indexOf("\x09")) >= 0) {
            text = text.substring(0, index) + VISIBLE_TAB + text.substring(index + 1);
            fragments.push(new Fragment(index, index + 1, Attr.SPECIAL));
        }

        // Create visible line.
        var line = new Line(text, indent, hasEol, start);

        // Apply special fragments.
        line.addFragments(Line.SPECIAL_CATEGORY, fragments);

        // Syntax highlighting.
        var commentIndex = text.indexOf("//");
        var re = /[a-zA-Z0-9_]+/g;
        var match;
        var lastStart = 0;
        while ((match = re.exec(text)) !== null) {
            var word = match[0];
            var start = match.index;
            var end = start + word.length;

            // Figure out the color of the word.
            var attr;
            if (JAVASCRIPT_KEYWORDS.hasOwnProperty(word)) {
                attr = Attr.DIM;
            } else if (commentIndex >= 0 && start >= commentIndex) {
                attr = Attr.DIM;
            } else {
                // This is a ghetto highlighter that tries to highlight each word a
                // different color by its hash. I thought it might be a good way to
                // see code, so that each identifier is easily tracked throughout
                // its use, but there are so many different identifiers that it's
                // not useful.
                if (false) {
                    var color = Math.abs(strings.hash(word)) % 256;
                    attr = new Attr(color, null, null, null);
                } else {
                    attr = Attr.NORMAL;
                }
            }
            if (lastStart !== start) {
                line.addFragment(Line.SYNTAX_CATEGORY, new Fragment(lastStart, start, Attr.DIM));
            }
            line.addFragment(Line.SYNTAX_CATEGORY, new Fragment(start, end, attr));
            lastStart = end;
        }
        if (lastStart != text.length) {
            line.addFragment(Line.SYNTAX_CATEGORY, new Fragment(lastStart, text.length, Attr.DIM));
        }

        lines.push(line);
    };

    var startOfLine = null;
    var indent = 0;
    for (var i = 0; i < buffer.length; i++) {
        if (startOfLine === null) {
            startOfLine = i;
        }

        // Wrap at one less than the max so that we never go up against the edge,
        // which causes problems when we try to go to the end of the line.
        if (i - startOfLine + indent >= this.wrapWidth - 1) {
            addLine(startOfLine, i, indent, false);
            // Don't lose current character.
            i--;
            indent = 16;
            startOfLine = null;
        } else if (buffer[i] === 10) {
            addLine(startOfLine, i, indent, true);
            startOfLine = null;
            indent = 0;
        }
    }

    // No newline on last line.
    if (startOfLine !== null) {
        addLine(startOfLine, buffer.length, indent, false);
    }

    // Must always have at least one line.
    if (lines.length === 0) {
        addLine(0, 0, 0, false);
    }

    layout.lines = lines;
};

module.exports = WrappingFormatter;

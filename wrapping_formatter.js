// Copyright 2014 Lawrence Kesteloot

"use strict";

var Line = require("./line");
var Fragment = require("./fragment");
var trace = require("./trace");
var term = require("./term");
var strings = require("./strings");

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

var WrappingFormatter = function (wrapWidth) {
    this.wrapWidth = wrapWidth;
};

WrappingFormatter.prototype.format = function (doc, layout) {
    var lines = [];
    var buffer = doc.buffer;

    var addLine = function (start, end, indent, hasEol) {
        var text = buffer.toString("utf8", start, end);
        var line = new Line(text, indent, hasEol, start);

        var commentIndex = text.indexOf("//");
        var re = /[a-zA-Z0-9_]+/g;
        var match;
        var lastStart = 0;
        while ((match = re.exec(text)) !== null) {
            var word = match[0];
            var start = match.index;
            var end = start + word.length;

            // Figure out the color of the word.
            var termFunction;
            if (JAVASCRIPT_KEYWORDS.hasOwnProperty(word)) {
                termFunction = term.dim;
            } else if (commentIndex >= 0 && start >= commentIndex) {
                termFunction = term.dim;
            } else {
                // This is a ghetto highlighter that tries to highlight each word a
                // different color by its hash. I thought it might be a good way to
                // see code, so that each identifier is easily tracked throughout
                // its use, but there are so many different identifiers that it's
                // not useful.
                if (false) {
                    var color = Math.abs(strings.hash(word)) % 256;
                    termFunction = function (color) {
                        return function () {
                            term.color(color);
                        };
                    }(color);
                } else {
                    termFunction = term.defaultColor;
                }
            }
            if (lastStart !== start) {
                line.addFragment(new Fragment(lastStart, start, term.dim));
            }
            line.addFragment(new Fragment(start, end, termFunction));
            lastStart = end;
        }
        if (lastStart != text.length) {
            line.addFragment(new Fragment(lastStart, text.length, term.dim));
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
        if (i - startOfLine >= this.wrapWidth - 1) {
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

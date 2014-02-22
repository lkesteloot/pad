// Copyright 2014 Lawrence Kesteloot

"use strict";

var term = require("./term");
var trace = require("./trace");

/**
 * fg and bg are 256-colors. Bold and underline are booleans. Any of these
 * can be null to mean "transparent".
 */
var Attr = function (fg, bg, bold, underline) {
    this.fg = fg;
    this.bg = bg;
    this.bold = bold;
    this.underline = underline;
};

Attr.NORMAL = new Attr(7, null, null, null);
Attr.DIM = new Attr(239, null, null, null);
Attr.HIGHLIGHT = new Attr(11, 28, null, null);
Attr.DIM_HIGHLIGHT = new Attr(7, 28, null, null);

Attr.prototype.apply = function () {
    term.reset();
    if (this.fg !== null) {
        term.color(this.fg);
    }
    if (this.bg !== null) {
        term.backgroundColor(this.bg);
    }
    if (this.bold === true) {
        term.bold();
    }
    if (this.underline === true) {
        term.underline();
    }
};

Attr.collapse = function (attrs) {
    var categories = Object.keys(attrs);
    categories.sort();

    var collapsedAttr = new Attr(null, null, null, null);

    categories.forEach(function (category) {
        var attr = attrs[category].attr;
        if (attr.fg !== null) {
            collapsedAttr.fg = attr.fg;
        }
        if (attr.bg !== null) {
            collapsedAttr.bg = attr.bg;
        }
        if (attr.bold !== null) {
            collapsedAttr.bold = attr.bold;
        }
        if (attr.underline !== null) {
            collapsedAttr.underline = attr.underline;
        }
    });

    return collapsedAttr;
};

module.exports = Attr;

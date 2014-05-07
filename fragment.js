// Copyright 2014 Lawrence Kesteloot

"use strict";

// A fragment is a piece of a line that has a specific attribute.
var Fragment = function (start, end, attr) {
    this.start = start;
    this.end = end;
    this.attr = attr;
};

module.exports = Fragment;

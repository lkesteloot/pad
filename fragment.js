// Copyright 2014 Lawrence Kesteloot

"use strict";

var Fragment = function (start, end, termFunction) {
    this.start = start;
    this.end = end;
    this.termFunction = termFunction;
};

Fragment.prototype.startSection = function () {
    this.termFunction();
};

module.exports = Fragment;

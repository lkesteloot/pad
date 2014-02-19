// Copyright 2014 Lawrence Kesteloot

"use strict";

/**
 * Abstract superclass of key plugins.
 **/
var AbstractKeys = function () {
    // Nothing.
};

/**
 * A printable version of our internal state.
 **/
AbstractKeys.prototype.getState = function () {
    return "";
};

/**
 * Handle the key (a string) for the pane and call the callback asynchronously.
 */
AbstractKeys.prototype.onKey = function (key, pane, callback) {
    process.nextTick(callback);
};

module.exports = AbstractKeys;

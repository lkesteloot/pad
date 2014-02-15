// Copyright 2014 Lawrence Kesteloot

"use strict";

exports.startsWith = function (text, prefix) {
    return text.substring(0, prefix.length) === prefix;
};

exports.unexpandHome = function (pathname) {
    var home = process.env["HOME"];

    if (home && exports.startsWith(pathname, home)) {
        pathname = "~" + pathname.substring(home.length);
    }

    return pathname;
};

exports.repeat = function (text, count) {
    // Not the fastest way for large counts.
    return new Array(count + 1).join(text);
};

/**
 * Return a hash code for the string. This implementation is
 * compatible with the String hash function in Java.
 */
exports.hash = function (text) {
    var hash = 0;
    var length = text.length;

    for (var i = 0; i < length; i++) {
        var ch = text.charCodeAt(i);
        hash = hash*31 + ch;
        hash |= 0; // Convert to 32bit integer
    }

    return hash;
};

// Copyright 2014 Lawrence Kesteloot

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

// Copyright 2014 Lawrence Kesteloot

exports.start = function () {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("data", onData);
};

exports.stop = function () {
    process.stdin.removeListener("data", onData);
    process.stdin.pause();
    process.stdin.setRawMode(false);
};

// data is a Node Buffer object.
var onData = function (data) {
    for (var i = 0; i < data.length; i++) {
        if (data[i] == 113) {
            // "q"
            exports.stop();
        }
        // process.stdout.write(" " + data[i]);
    }
};

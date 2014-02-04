// Copyright 2014 Lawrence Kesteloot

var ESC = String.fromCharCode(27);
var CSI = ESC + "[";

var write = function (text) {
    process.stdout.write(text);
};
exports.write = write;

exports.moveTo = function (x, y) {
    write(CSI + (y + 1) + ";" + (x + 1) + "H");
};

exports.clearChars = function (count) {
    write(CSI + count + "X");
};

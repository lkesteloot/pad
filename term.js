// Copyright 2014 Lawrence Kesteloot

var ESC = String.fromCharCode(27);
var CSI = ESC + "[";

var write = function (text) {
    process.stdout.write(text);
};
exports.write = write;

var writeCsi = function (numbers, letter) {
    if (!(numbers instanceof Array)) {
        numbers = [numbers];
    }

    write(CSI + numbers.join(";") + letter);
};

exports.moveTo = function (x, y) {
    writeCsi([y + 1, x + 1], "H");
};

exports.clearChars = function (count) {
    writeCsi(count, "X");
};

exports.setColor = function (colors) {
    writeCsi(colors, "m");
}

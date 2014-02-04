// Copyright 2014 Lawrence Kesteloot

var Buffer = require("./buffer.js").Buffer;
var Pane = require("./pane.js").Pane;

var buffer = new Buffer();

if (process.argv.length <= 2) {
    console.log("usage: pad filename");
} else {
    var filename = process.argv[2];
    buffer.readFile(filename, function () {
        var pane = new Pane();
        pane.setBuffer(buffer);
        pane.redraw(20, 5);
    }, function (err) {
        if (err.code === "ENOENT") {
            console.log("File not found: " + filename);
        } else {
            console.log("Error loading file: " + err);
        }
    });
}

// process.stdin.setRawMode(true);
// process.stdin.resume();

// Copyright 2014 Lawrence Kesteloot

var Buffer = require("./buffer.js").Buffer;
var Layout = require("./layout.js").Layout;
var SimpleFormatter = require("./simple_formatter.js").SimpleFormatter;
var WrappingFormatter = require("./wrapping_formatter.js").WrappingFormatter;

var buffer = new Buffer();

if (process.argv.length <= 2) {
    console.log("usage: pad filename");
} else {
    var filename = process.argv[2];
    buffer.readFile(filename, function () {
        var layout = new Layout(formatter);
        var formatter = true ? new WrappingFormatter() : new SimpleFormatter();
        formatter.format(buffer, layout);
        layout.log();
    }, function (err) {
        if (err.code === "ENOENT") {
            console.log("File not found: " + filename);
        } else {
            console.log("Error loading file: " + err);
        }
    });
}

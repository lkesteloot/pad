// Copyright 2014 Lawrence Kesteloot

var Window = require("./window.js").Window;
var input = require("./input.js");

if (process.argv.length <= 2) {
    console.log("usage: pad filename");
} else {
    var window = new Window();
    window.panes[0].loadFile(process.argv[2]);
    input.start();
}

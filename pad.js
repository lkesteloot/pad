// Copyright 2014 Lawrence Kesteloot

var Window = require("./window.js").Window;
var input = require("./input.js");

var window = new Window();

if (process.argv.length <= 2) {
    console.log("usage: pad filename");
} else {
    window.panes[0].loadFile(process.argv[2]);
}

input.start();

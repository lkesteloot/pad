// Copyright 2014 Lawrence Kesteloot

"use strict";

var util = require("util");
var ViKeys = require("./vi_keys");

var StatusKeys = function () {
    ViKeys.call(this);
    this.setMode(ViKeys.MODE_INSERT);
};
util.inherits(StatusKeys, ViKeys);

module.exports = StatusKeys;

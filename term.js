// Copyright 2014 Lawrence Kesteloot

var ESC = String.fromCharCode(27);
var CSI = ESC + "[";

var write = function (text) {
    process.stdout.write(text);
};
exports.write = write;

exports.moveTo = function (x, y) {
    exports.ansiSequence("H", [y + 1, x + 1]);
};

// The following are iTerm2-only.

exports.blockCursor = function () {
    write("\u001B]50;CursorShape=0\u0007");
};

exports.barCursor = function () {
    write("\u001B]50;CursorShape=1\u0007");
};

exports.underlineCursor = function () {
    write("\u001B]50;CursorShape=2\u0007");
};

// Remainder is mostly copied from the "jetty" package by Conrad Pankoff. Changes
// include adding "X" command, renaming "colour" to "color", and making methods
// direct functions that write to stdout. Its license is as follows:
//
//     Copyright (c) 2013, Deoxxa Development
//     ======================================
//     All rights reserved.
//     --------------------
//       
//     Redistribution and use in source and binary forms, with or without
//     modification, are permitted provided that the following conditions are met:  
//     1. Redistributions of source code must retain the above copyright
//        notice, this list of conditions and the following disclaimer.  
//     2. Redistributions in binary form must reproduce the above copyright
//        notice, this list of conditions and the following disclaimer in the
//        documentation and/or other materials provided with the distribution.  
//     3. Neither the name of Deoxxa Development nor the names of its contributors
//        may be used to endorse or promote products derived from this software
//        without specific prior written permission.  
//       
//     THIS SOFTWARE IS PROVIDED BY DEOXXA DEVELOPMENT ''AS IS'' AND ANY
//     EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
//     WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
//     DISCLAIMED. IN NO EVENT SHALL DEOXXA DEVELOPMENT BE LIABLE FOR ANY
//     DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
//     (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
//     LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
//     ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
//     (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
//     SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

var util = require("util");

exports.ansiSequence = function (char, args) {
    write(CSI);
    if (args && args.length) {
        write(args.join(";"));
    }
    write(char);
};

codes = [
    {name: "moveUp",      code:"A"},
    {name: "moveDown",    code:"B"},
    {name: "moveLeft",    code:"C"},
    {name: "moveRight",   code:"D"},
    {name: "lineUp",      code:"E"},
    {name: "lineDown",    code:"F"},
    // {name: "moveTo",      code:"H",   map: function (e) { return e +  1; }},
    {name: "clear",       code:"J",   map: function (e) { return e || 2; }},
    {name: "clearLine",   code:"K",   map: function (e) { return e || 1; }},
    {name: "save",        code:"S"},
    {name: "restore",     code:"U"},
    {name: "clearChars",  code:"X"},
    {name: "hideCursor",  code:"?25l"},
    {name: "showCursor",  code:"?25h"},
    {name: "sgr",         code:"m"}, // Select Graphic Rendition.
];

codes.map(function (code) {
    exports[code.name] = function (n) {
        if (!util.isArray(n)) { n = [n]; }
        exports.ansiSequence(code.code, code.map ? n.map(code.map) : n);
    };
});

var sgrCodes = [
    {name: "reset",                   code: 0 },
    {name: "bold",                    code: 1 },
    {name: "faint",                   code: 2 },
    {name: "italic",                  code: 3 },
    {name: "underline",               code: 4 },
    {name: "blink",                   code: 5 },
    {name: "blinkRapid",              code: 6 },
    {name: "reverse",                 code: 7 },
    {name: "conceal",                 code: 8 },
    {name: "strikeout",               code: 9 },
    {name: "font",                    code: function (n) { return [10 + (Number(n)||0)];   }},
    {name: "boldOff",                 code: 21},
    {name: "normal",                  code: 22},
    {name: "italicOff",               code: 23},
    {name: "underlineOff",            code: 24},
    {name: "blinkOff",                code: 25},
    {name: "reverseOff",              code: 27},
    {name: "reveal",                  code: 28},
    {name: "strikeoutOff",            code: 29},
    {name: "legacyColor",             code: function (n)   { return [30 + (Number(n)||0)]; }},
    {name: "color",                   code: function (dec) { return [38, 5, dec];          }},
    {name: "defaultColor",            code: 39},
    {name: "legacyBackgroundColor",   code: function (n)   { return [40 + (Number(n)||0)]; }},
    {name: "backgroundColor",         code: function (dec) { return [48, 5, dec];          }},
    {name: "defaultBackgroundColor",  code: 49},
    {name: "frame",                   code: 51},
    {name: "encircle",                code: 52},
    {name: "overline",                code: 53},
    {name: "frameOff",                code: 54},
    {name: "overlineOff",             code: 55}
];

sgrCodes.map(function (code) {
    exports[code.name] = function (n) {
        exports.sgr(
            typeof code.code === 'function'
            ? code.code(n)
            : [code.code]
        );
    }
});

// Channels is either an [r,g,b] triple (with each component
// from 0 to 5 inclusive) or a 256-color index.
exports.rgb = function (channels, isBackground) {
    exports[isBackground ? 'backgroundColor' : 'color'](
        util.isArray(channels)        // color value
        ? exports.rgb2dec(channels)     // [r,g,b] => dec
        : channels                    // dec
    );
};

exports.rgb2dec = function (channels) {
    return channels.reverse().reduce(function (dec, value, bit) {
        return dec + value * Math.pow(6, bit);
    }, 16);
};

exports.dec2rgb = function (dec) {
    return ("000" + dec.toString(6)).substr(-3, 3).split('').map(function (value) {
        return parseInt(value);
    });
};

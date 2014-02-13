# Pad

## Overview

Pad is a programmer's text editor written in Node.js. It's meant to be
used in a terminal, such as iTerm2 for the Mac. It does not have a GUI.
The key bindings are currently (mostly) vi-compatible.

See the NOTES file for various architecture notes, to-do list, and
design ideas.

## Status

The editor can show text files. Very basic vi movement and edit
keys are supported. All work on the code is done with pad,
so it's at least self-hosting. The editor is incredibly inefficient
(e.g., it lays out all the text and redraws the whole screen with
every keystroke), but this is still fast enough to not be noticed
on the author's computer.

## Usage

The script requires Node.js. It has been tested on Node version 0.10.22.
To install, download this repo and run the "pad" script, specifying
an existing file to edit:

    % pad foo.js

To quit, type:

    :q()

The command line is evaluated as JavaScript, so you need to add the
parentheses to call the quit (q) function. To save the file, type:

    :w()


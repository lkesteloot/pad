Pad is a programmer's text editor written in Node.js. It's meant to be
used in a terminal, such as iTerm2 for the Mac. It does not have a GUI.
The key bindings are currently (mostly) vi-compatible.

See the NOTES file for various architecture notes, to-do list, and
design ideas.

To install, download this repo and run the "pad" script, specifying
an existing file to edit:

    % pad foo.js

To quit, type:

    :q()

The command line is evaluated as JavaScript, so you need to add the
parentheses to call the quit (q) function. To save the file, type:

    :w()


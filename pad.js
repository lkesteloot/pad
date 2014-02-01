
var ncurses = require("ncurses");

var window = new ncurses.Window();

window.on("inputChar", function (char, charCode, isKey) {
    // console.log(char, charCode, isKey);

    if (isKey) {
        // Special key, like arrow keys.
    } else {
        switch (charCode) {
            case 113: // q
            case ncurses.keys.ESC:
                window.close();
                break;
        }
    }
});

window.refresh();

// window.hline(ncurses.cols, ncurses.ACS.DIAMOND);
// ncurses.bell();

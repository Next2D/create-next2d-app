/**
 * A minimal drop-in replacement for `picocolors`.
 *
 * Provides the same ANSI color helpers with the same color-support detection
 * (NO_COLOR / FORCE_COLOR / --color / TTY / CI) as the original library.
 */

interface Colors {
    isColorSupported: boolean;
    reset: (input: unknown) => string;
    bold: (input: unknown) => string;
    dim: (input: unknown) => string;
    italic: (input: unknown) => string;
    underline: (input: unknown) => string;
    inverse: (input: unknown) => string;
    hidden: (input: unknown) => string;
    strikethrough: (input: unknown) => string;
    black: (input: unknown) => string;
    red: (input: unknown) => string;
    green: (input: unknown) => string;
    yellow: (input: unknown) => string;
    blue: (input: unknown) => string;
    magenta: (input: unknown) => string;
    cyan: (input: unknown) => string;
    white: (input: unknown) => string;
    gray: (input: unknown) => string;
    bgBlack: (input: unknown) => string;
    bgRed: (input: unknown) => string;
    bgGreen: (input: unknown) => string;
    bgYellow: (input: unknown) => string;
    bgBlue: (input: unknown) => string;
    bgMagenta: (input: unknown) => string;
    bgCyan: (input: unknown) => string;
    bgWhite: (input: unknown) => string;
}

const argv: string[] = process.argv || [];
const env: NodeJS.ProcessEnv = process.env || {};

const isColorSupported: boolean =
    !(!!env.NO_COLOR || argv.includes("--no-color")) &&
    (!!env.FORCE_COLOR || argv.includes("--color") ||
     process.platform === "win32" ||
     ((process.stdout || {}).isTTY && env.TERM !== "dumb") ||
     !!env.CI);

const replaceClose = (
    string: string,
    close: string,
    replace: string,
    index: number
): string => {
    let result: string = "";
    let cursor: number = 0;
    do {
        result += string.substring(cursor, index) + replace;
        cursor = index + close.length;
        index = string.indexOf(close, cursor);
    } while (~index);
    return result + string.substring(cursor);
};

const formatter = (open: string, close: string, replace: string = open) =>
    (input: unknown): string => {
        const string: string = "" + input;
        const index: number = string.indexOf(close, open.length);
        return ~index
            ? open + replaceClose(string, close, replace, index) + close
            : open + string + close;
    };

const createColors = (enabled: boolean = isColorSupported): Colors => {
    const f = enabled ? formatter : () => (input: unknown): string => String(input);
    return {
        "isColorSupported": enabled,
        "reset": f("\x1b[0m", "\x1b[0m"),
        "bold": f("\x1b[1m", "\x1b[22m", "\x1b[22m\x1b[1m"),
        "dim": f("\x1b[2m", "\x1b[22m", "\x1b[22m\x1b[2m"),
        "italic": f("\x1b[3m", "\x1b[23m"),
        "underline": f("\x1b[4m", "\x1b[24m"),
        "inverse": f("\x1b[7m", "\x1b[27m"),
        "hidden": f("\x1b[8m", "\x1b[28m"),
        "strikethrough": f("\x1b[9m", "\x1b[29m"),
        "black": f("\x1b[30m", "\x1b[39m"),
        "red": f("\x1b[31m", "\x1b[39m"),
        "green": f("\x1b[32m", "\x1b[39m"),
        "yellow": f("\x1b[33m", "\x1b[39m"),
        "blue": f("\x1b[34m", "\x1b[39m"),
        "magenta": f("\x1b[35m", "\x1b[39m"),
        "cyan": f("\x1b[36m", "\x1b[39m"),
        "white": f("\x1b[37m", "\x1b[39m"),
        "gray": f("\x1b[90m", "\x1b[39m"),
        "bgBlack": f("\x1b[40m", "\x1b[49m"),
        "bgRed": f("\x1b[41m", "\x1b[49m"),
        "bgGreen": f("\x1b[42m", "\x1b[49m"),
        "bgYellow": f("\x1b[43m", "\x1b[49m"),
        "bgBlue": f("\x1b[44m", "\x1b[49m"),
        "bgMagenta": f("\x1b[45m", "\x1b[49m"),
        "bgCyan": f("\x1b[46m", "\x1b[49m"),
        "bgWhite": f("\x1b[47m", "\x1b[49m")
    };
};

const colors: Colors = createColors();

export default colors;
export { createColors };

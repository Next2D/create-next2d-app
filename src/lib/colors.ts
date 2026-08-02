/**
 * A minimal drop-in replacement for `picocolors`, exposing only the helpers
 * actually used by `src/index.ts` (`red`, `green`, `cyan`, `yellow`, `bold`).
 */

interface Colors {
    isColorSupported: boolean;
    red: (input: unknown) => string;
    green: (input: unknown) => string;
    cyan: (input: unknown) => string;
    yellow: (input: unknown) => string;
    bold: (input: unknown) => string;
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
        "red": f("\x1b[31m", "\x1b[39m"),
        "green": f("\x1b[32m", "\x1b[39m"),
        "cyan": f("\x1b[36m", "\x1b[39m"),
        "yellow": f("\x1b[33m", "\x1b[39m"),
        "bold": f("\x1b[1m", "\x1b[22m", "\x1b[22m\x1b[1m")
    };
};

const colors: Colors = createColors();

export default colors;
export { createColors };

/**
 * A minimal drop-in replacement for the `fs-extra` API used by this tool.
 *
 * Re-exports Node's `fs` and adds the `ensureDirSync` and `copySync` helpers
 * that are not part of the built-in module.
 */

import * as fs from "node:fs";
import path from "node:path";

const ensureDirSync = (dir: string): void => {
    fs.mkdirSync(dir, { "recursive": true });
};

const copySync = (src: string, dest: string): void => {
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
        fs.mkdirSync(dest, { "recursive": true });
        for (const entry of fs.readdirSync(src)) {
            copySync(path.join(src, entry), path.join(dest, entry));
        }
    } else if (stat.isFile()) {
        fs.copyFileSync(src, dest);
    } else if (stat.isSymbolicLink()) {
        const link = fs.readlinkSync(src);
        fs.symlinkSync(link, dest);
    }
};

const fsExtra: typeof fs & {
    ensureDirSync: typeof ensureDirSync;
    copySync: typeof copySync;
} = {
    ...fs,
    ensureDirSync,
    copySync
};

export default fsExtra;

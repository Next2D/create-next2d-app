/**
 * A minimal drop-in replacement for the `fs-extra` API used by this tool.
 *
 * Exposes only the functions used by `src/index.ts` (`ensureDirSync`,
 * `writeFileSync`, `existsSync`, `readFileSync`, `copySync`) plus the Node
 * primitives required internally.
 */

import * as fs from "node:fs";
import path from "node:path";

const ensureDirSync = (dir: string): void => {
    fs.mkdirSync(dir, { "recursive": true });
};

const copySync = (src: string, dest: string): void => {
    const stat = fs.lstatSync(src);
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

const fsExtra = {
    "ensureDirSync": ensureDirSync,
    "copySync": copySync,
    "existsSync": fs.existsSync,
    "readFileSync": fs.readFileSync,
    "writeFileSync": fs.writeFileSync
};

export default fsExtra;

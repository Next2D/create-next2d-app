import { test, expect } from "vitest";
import { mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import fsx from "../src/lib/fs-extra";

const makeBase = (): string => mkdtempSync(path.join(tmpdir(), "fsx-"));

test("ensureDirSync creates a directory recursively", () => {
    const base = makeBase();
    try {
        const dir = path.join(base, "a", "b");
        fsx.ensureDirSync(dir);
        expect(fsx.existsSync(dir)).toBe(true);
    } finally {
        rmSync(base, { "recursive": true, "force": true });
    }
});

test("copySync copies a directory tree recursively", () => {
    const base = makeBase();
    try {
        const src = path.join(base, "src");
        const dest = path.join(base, "dest");
        fsx.ensureDirSync(path.join(src, "sub"));
        fsx.writeFileSync(path.join(src, "a.txt"), "hello");
        fsx.writeFileSync(path.join(src, "sub", "b.txt"), "world");

        fsx.copySync(src, dest);

        expect(fsx.existsSync(path.join(dest, "a.txt"))).toBe(true);
        expect(fsx.readFileSync(path.join(dest, "sub", "b.txt"), "utf8")).toBe("world");
    } finally {
        rmSync(base, { "recursive": true, "force": true });
    }
});

test("copySync copies a single file", () => {
    const base = makeBase();
    try {
        const src = path.join(base, "f.txt");
        const dest = path.join(base, "g.txt");
        fsx.writeFileSync(src, "data");
        fsx.copySync(src, dest);
        expect(fsx.readFileSync(dest, "utf8")).toBe("data");
    } finally {
        rmSync(base, { "recursive": true, "force": true });
    }
});

test("copySync follows a symbolic link", () => {
    const base = makeBase();
    try {
        const target = path.join(base, "target.txt");
        const link = path.join(base, "link");
        fsx.writeFileSync(target, "linked");
        symlinkSync(target, link);
        fsx.copySync(link, path.join(base, "copy.txt"));
        expect(fsx.readFileSync(path.join(base, "copy.txt"), "utf8")).toBe("linked");
    } finally {
        rmSync(base, { "recursive": true, "force": true });
    }
});

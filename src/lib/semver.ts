/**
 * A minimal drop-in replacement for the `semver` API used by this tool.
 *
 * Implements version parsing and comparison so that `gte(a, b)` behaves the
 * same as `semver.gte(a, b)`.
 */

interface SemVer {
    major: number;
    minor: number;
    patch: number;
    prerelease: (string | number)[];
}

const SEMVER_REGEX =
    /^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

const parse = (version: string): SemVer => {
    const match = version.trim().match(SEMVER_REGEX);
    if (match === null) {
        throw new Error(`Invalid version: ${version}`);
    }

    const major = Number(match[1]);
    const minor = Number(match[2] || 0);
    const patch = Number(match[3] || 0);

    const prerelease: (string | number)[] = [];
    if (match[4] !== undefined) {
        const parts: string[] = match[4].split(".");
        for (const part of parts) {
            prerelease.push(part.match(/^[0-9]+$/) ? Number(part) : part);
        }
    }

    return { major, minor, patch, prerelease };
};

const compareMain = (a: SemVer, b: SemVer): number => {
    if (a.major < b.major) {
        return -1;
    }
    if (a.major > b.major) {
        return 1;
    }
    if (a.minor < b.minor) {
        return -1;
    }
    if (a.minor > b.minor) {
        return 1;
    }
    if (a.patch < b.patch) {
        return -1;
    }
    if (a.patch > b.patch) {
        return 1;
    }
    return 0;
};

const compareIdentifiers = (a: string | number, b: string | number): number => {
    const aIsNumber = typeof a === "number";
    const bIsNumber = typeof b === "number";
    if (aIsNumber && bIsNumber) {
        return a < b ? -1 : a > b ? 1 : 0;
    }
    if (aIsNumber) {
        return -1;
    }
    if (bIsNumber) {
        return 1;
    }
    return a < b ? -1 : a > b ? 1 : 0;
};

const comparePre = (a: SemVer, b: SemVer): number => {
    if (a.prerelease.length && !b.prerelease.length) {
        return -1;
    }
    if (!a.prerelease.length && b.prerelease.length) {
        return 1;
    }
    if (!a.prerelease.length && !b.prerelease.length) {
        return 0;
    }

    const len = Math.max(a.prerelease.length, b.prerelease.length);
    for (let i = 0; i < len; ++i) {
        const x = a.prerelease[i];
        const y = b.prerelease[i];
        if (x === undefined && y === undefined) {
            return 0;
        }
        if (y === undefined) {
            return 1;
        }
        if (x === undefined) {
            return -1;
        }
        if (x === y) {
            continue;
        }
        return compareIdentifiers(x, y);
    }
    return 0;
};

const compare = (a: string, b: string): number => {
    const va = parse(a);
    const vb = parse(b);
    return compareMain(va, vb) || comparePre(va, vb);
};

const gte = (a: string, b: string): boolean => compare(a, b) >= 0;

export { gte };

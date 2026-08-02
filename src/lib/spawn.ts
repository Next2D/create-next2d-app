/**
 * A minimal drop-in replacement for `cross-spawn`.
 *
 * Delegates to Node's `child_process` and, like `cross-spawn`, transparently
 * resolves commands (e.g. `npm.cmd`) on Windows by running through a shell.
 */

import {
    spawn as nodeSpawn,
    spawnSync as nodeSpawnSync
} from "node:child_process";
import type {
    ChildProcess,
    SpawnOptions,
    SpawnSyncOptions
} from "node:child_process";

const isWindows: boolean = process.platform === "win32";

const spawnFn = (
    command: string,
    args?: readonly string[],
    options?: SpawnOptions
): ChildProcess => {
    const opts: SpawnOptions = isWindows
        ? { ...options, "shell": true }
        : (options ?? {});
    return nodeSpawn(command, args ?? [], opts);
};

const spawnSyncFn = (
    command: string,
    args?: readonly string[],
    options?: SpawnSyncOptions
) => {
    const opts: SpawnSyncOptions = isWindows
        ? { ...options, "shell": true }
        : (options ?? {});
    return nodeSpawnSync(command, args ?? [], opts);
};

type SpawnFn = typeof spawnFn & {
    sync: typeof spawnSyncFn;
    spawn: typeof spawnFn;
};

const spawn: SpawnFn = spawnFn as SpawnFn;
spawn.sync = spawnSyncFn;
spawn.spawn = spawnFn;

export default spawn;

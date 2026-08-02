/**
 * A minimal drop-in replacement for `validate-npm-package-name`.
 *
 * Reproduces the same validation rules (and messages) as the original package.
 */

const BUILTINS: string[] = [
    "_http_agent", "_http_client", "_http_common", "_http_incoming",
    "_http_outgoing", "_http_server", "_stream_duplex", "_stream_passthrough",
    "_stream_readable", "_stream_transform", "_stream_wrap", "_stream_writable",
    "_tls_common", "_tls_wrap", "assert", "assert/strict", "async_hooks",
    "buffer", "child_process", "cluster", "console", "constants", "crypto",
    "dgram", "diagnostics_channel", "dns", "dns/promises", "domain", "events",
    "fs", "fs/promises", "http", "http2", "https", "inspector",
    "inspector/promises", "module", "net", "os", "path", "path/posix",
    "path/win32", "perf_hooks", "process", "punycode", "querystring",
    "readline", "readline/promises", "repl", "stream", "stream/consumers",
    "stream/promises", "stream/web", "string_decoder", "sys", "timers",
    "timers/promises", "tls", "trace_events", "tty", "url", "util",
    "util/types", "v8", "vm", "wasi", "worker_threads", "zlib", "node:sea",
    "node:sqlite", "node:test", "node:test/reporters"
];

const SCOPED_PACKAGE_PATTERN = /^(?:@([^/]+?)[/])?([^/]+?)$/;

const EXCLUSION_LIST: string[] = [
    "node_modules",
    "favicon.ico"
];

interface ValidationResult {
    validForNewPackages: boolean;
    validForOldPackages: boolean;
    warnings?: string[];
    errors?: string[];
}

const validate = (name: unknown): ValidationResult => {
    const warnings: string[] = [];
    const errors: string[] = [];

    if (name === null) {
        errors.push("name cannot be null");
        return done(warnings, errors);
    }

    if (name === undefined) {
        errors.push("name cannot be undefined");
        return done(warnings, errors);
    }

    if (typeof name !== "string") {
        errors.push("name must be a string");
        return done(warnings, errors);
    }

    if (!name.length) {
        errors.push("name length must be greater than zero");
    }

    if (name.startsWith(".")) {
        errors.push("name cannot start with a period");
    }

    if (name.startsWith("-")) {
        errors.push("name cannot start with a hyphen");
    }

    if (name.match(/^_/)) {
        errors.push("name cannot start with an underscore");
    }

    if (name.trim() !== name) {
        errors.push("name cannot contain leading or trailing spaces");
    }

    for (const excludedName of EXCLUSION_LIST) {
        if (name.toLowerCase() === excludedName) {
            errors.push(excludedName + " is not a valid package name");
        }
    }

    if (BUILTINS.includes(name.toLowerCase())) {
        warnings.push(name + " is a core module name");
    }

    if (name.length > 214) {
        warnings.push("name can no longer contain more than 214 characters");
    }

    if (name.toLowerCase() !== name) {
        warnings.push("name can no longer contain capital letters");
    }

    if (/[~'!()*]/.test(name.split("/").slice(-1)[0])) {
        warnings.push("name can no longer contain special characters (\"~'!()*\")");
    }

    if (encodeURIComponent(name) !== name) {
        const nameMatch = name.match(SCOPED_PACKAGE_PATTERN);
        if (nameMatch) {
            const user = nameMatch[1];
            const pkg = nameMatch[2];

            if (pkg.startsWith(".")) {
                errors.push("name cannot start with a period");
            }

            if (encodeURIComponent(user) === user &&
                encodeURIComponent(pkg) === pkg) {
                return done(warnings, errors);
            }
        }

        errors.push("name can only contain URL-friendly characters");
    }

    return done(warnings, errors);
};

const done = (warnings: string[], errors: string[]): ValidationResult => {
    const result: ValidationResult = {
        "validForNewPackages": errors.length === 0 && warnings.length === 0,
        "validForOldPackages": errors.length === 0
    };
    if (warnings.length) {
        result.warnings = warnings;
    }
    if (errors.length) {
        result.errors = errors;
    }
    return result;
};

export default validate;

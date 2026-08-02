import { test, expect } from "vitest";
import Command from "../src/lib/command";

interface Capture {
    logs: string[];
    errors: string[];
    exitCode: () => number | null;
    restore: () => void;
}

const originalExit = process.exit;
const originalLog = console.log;
const originalError = console.error;

const capture = (): Capture => {
    const logs: string[] = [];
    const errors: string[] = [];
    let exitCode: number | null = null;

    (process as unknown as { exit: (code?: number) => void }).exit =
        (code?: number) => {
            exitCode = code ?? 0;
            throw new Error("exit");
        };
    console.log = (msg?: unknown) => { logs.push(String(msg)); };
    console.error = (msg?: unknown) => { errors.push(String(msg)); };

    return {
        logs,
        errors,
        "exitCode": () => exitCode,
        "restore": () => {
            process.exit = originalExit;
            console.log = originalLog;
            console.error = originalError;
        }
    };
};

const makeProgram = (action: (name: string) => void = () => {}) =>
    new Command("create-next2d-app")
        .version("2.3.1")
        .arguments("<project-directory>")
        .usage("<project-directory> [options]")
        .action(action)
        .option("--info", "print environment debug info")
        .option(
            "--template <path-to-template>",
            "specify a template for the created project"
        )
        .on("-h, --help", () => {
            console.log("A custom --template can be one of:");
        });

test("name() returns the program name", () => {
    const c = capture();
    try {
        expect(makeProgram().name()).toBe("create-next2d-app");
    } finally {
        c.restore();
    }
});

test("--version prints the version and exits 0", () => {
    const c = capture();
    try {
        expect(() => makeProgram().parse(["node", "test", "--version"])).toThrow(/exit/);
        expect(c.logs).toEqual(["2.3.1"]);
        expect(c.exitCode()).toBe(0);
    } finally {
        c.restore();
    }
});

test("-V prints the version and exits 0", () => {
    const c = capture();
    try {
        expect(() => makeProgram().parse(["node", "test", "-V"])).toThrow(/exit/);
        expect(c.logs).toEqual(["2.3.1"]);
        expect(c.exitCode()).toBe(0);
    } finally {
        c.restore();
    }
});

test("--help prints help, fires the custom event, and exits 0", () => {
    const c = capture();
    try {
        expect(() => makeProgram().parse(["node", "test", "--help"])).toThrow(/exit/);
        const joined = c.logs.join("\n");
        expect(joined).toContain("Usage: create-next2d-app <project-directory> [options]");
        expect(joined).toContain("-V, --version");
        expect(joined).toContain("--template <path-to-template>");
        expect(joined).toContain("-h, --help");
        expect(joined).toContain("A custom --template can be one of:");
        expect(c.exitCode()).toBe(0);
    } finally {
        c.restore();
    }
});

test("-h fires the custom help event", () => {
    const c = capture();
    try {
        expect(() => makeProgram().parse(["node", "test", "-h"])).toThrow(/exit/);
        expect(c.logs.join("\n")).toContain("A custom --template can be one of:");
        expect(c.exitCode()).toBe(0);
    } finally {
        c.restore();
    }
});

test("help uses the default usage when none is set", () => {
    const c = capture();
    try {
        expect(() => {
            new Command("app")
                .arguments("<project-directory>")
                .parse(["node", "test", "--help"]);
        }).toThrow(/exit/);
        expect(c.logs.join("\n")).toContain("Usage: app [options]");
    } finally {
        c.restore();
    }
});

test("missing required argument errors and exits 1", () => {
    const c = capture();
    try {
        expect(() => makeProgram().parse(["node", "test"])).toThrow(/exit/);
        expect(c.errors).toEqual(["error: missing required argument 'project-directory'"]);
        expect(c.exitCode()).toBe(1);
    } finally {
        c.restore();
    }
});

test("parses options and calls the action with the positional", () => {
    const c = capture();
    let actionName: string = "";
    try {
        const program = makeProgram((name) => { actionName = name; })
            .parse(["node", "test", "my-app", "--template", "@foo/bar", "--info"]);
        expect(actionName).toBe("my-app");
        expect(program.opts().template).toBe("@foo/bar");
        expect(program.opts().info).toBe(true);
        expect(c.exitCode()).toBeNull();
    } finally {
        c.restore();
    }
});

test("supports --template=value syntax", () => {
    const c = capture();
    try {
        const program = makeProgram()
            .parse(["node", "test", "my-app", "--template=@foo/baz"]);
        expect(program.opts().template).toBe("@foo/baz");
        expect(c.exitCode()).toBeNull();
    } finally {
        c.restore();
    }
});

test("treats arguments after -- as positionals", () => {
    const c = capture();
    const positionals: string[] = [];
    try {
        makeProgram((...names: string[]) => { positionals.push(...names); })
            .parse(["node", "test", "my-app", "--", "--info"]);
        expect(positionals).toEqual(["my-app", "--info"]);
        expect(c.exitCode()).toBeNull();
    } finally {
        c.restore();
    }
});

test("errors on an unknown long option", () => {
    const c = capture();
    try {
        expect(() => makeProgram().parse(["node", "test", "--foo"])).toThrow(/exit/);
        expect(c.errors).toEqual(["error: unknown option '--foo'"]);
        expect(c.exitCode()).toBe(1);
    } finally {
        c.restore();
    }
});

test("errors on an unknown short option", () => {
    const c = capture();
    try {
        expect(() => makeProgram().parse(["node", "test", "-x"])).toThrow(/exit/);
        expect(c.errors).toEqual(["error: unknown option '-x'"]);
        expect(c.exitCode()).toBe(1);
    } finally {
        c.restore();
    }
});

test("multiple handlers for the same event all fire on help", () => {
    const c = capture();
    try {
        const program = new Command("create-next2d-app")
            .version("2.3.1")
            .arguments("<project-directory>")
            .usage("<project-directory> [options]")
            .option("--info", "print environment debug info")
            .on("-h, --help", () => { console.log("handler one"); })
            .on("-h, --help", () => { console.log("handler two"); });
        expect(() => program.parse(["node", "test", "--help"])).toThrow(/exit/);
        const joined = c.logs.join("\n");
        expect(joined).toContain("handler one");
        expect(joined).toContain("handler two");
        expect(c.exitCode()).toBe(0);
    } finally {
        c.restore();
    }
});

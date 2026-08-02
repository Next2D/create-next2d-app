import { test, expect } from "vitest";
import spawn from "../src/lib/spawn";

test("spawn.sync captures combined output", () => {
    const result = spawn.sync("npm", ["config", "list"]);
    const output = result.output.join("");
    expect(typeof output).toBe("string");
    expect(output).toContain("cwd = ");
    expect(result.status).toBe(0);
});

test("spawn.sync reports an error for a missing command", () => {
    const result = spawn.sync("definitely-not-a-command-xyz", []);
    expect(result.status).toBeNull();
    expect(result.error).toBeTruthy();
});

test("spawn returns a child process with event methods", () => {
    const child = spawn("npm", ["--version"]);
    expect(typeof child.on).toBe("function");
    child.kill();
});

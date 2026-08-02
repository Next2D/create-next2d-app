import { test, expect } from "vitest";
import colors, { createColors } from "../src/lib/colors";

test("default export wraps or leaves text based on color support", () => {
    for (const fn of [colors.red, colors.green, colors.cyan, colors.yellow, colors.bold]) {
        const out = fn("x");
        expect(typeof out).toBe("string");
    }
});

test("createColors(false) leaves text unchanged", () => {
    const c = createColors(false);
    expect(c.red("hello")).toBe("hello");
    expect(c.green("hello")).toBe("hello");
    expect(c.cyan("hello")).toBe("hello");
    expect(c.yellow("hello")).toBe("hello");
    expect(c.bold("hello")).toBe("hello");
    expect(c.isColorSupported).toBe(false);
});

test("createColors(true) wraps text in ANSI codes", () => {
    const c = createColors(true);
    expect(c.red("hello")).toBe("\x1b[31mhello\x1b[39m");
    expect(c.green("hello")).toBe("\x1b[32mhello\x1b[39m");
    expect(c.cyan("hello")).toBe("\x1b[36mhello\x1b[39m");
    expect(c.yellow("hello")).toBe("\x1b[33mhello\x1b[39m");
    expect(c.bold("hello")).toBe("\x1b[1mhello\x1b[22m");
    expect(c.isColorSupported).toBe(true);
});

test("formatter coerces non-string input", () => {
    const c = createColors(true);
    expect(c.red(123)).toBe("\x1b[31m123\x1b[39m");
});

test("nested colors replace close sequences correctly", () => {
    const c = createColors(true);
    expect(c.red(c.green("x"))).toBe("\x1b[31m\x1b[32mx\x1b[31m\x1b[39m");
});

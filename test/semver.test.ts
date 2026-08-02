import { test, expect } from "vitest";
import { gte } from "../src/lib/semver";

test("gte compares major/minor/patch numerically", () => {
    expect(gte("11.0.0", "10.0.0")).toBe(true);
    expect(gte("10.1.0", "10.0.0")).toBe(true);
    expect(gte("10.0.1", "10.0.0")).toBe(true);
    expect(gte("10.0.0", "10.0.0")).toBe(true);
    expect(gte("9.9.9", "10.0.0")).toBe(false);
    expect(gte("10.0.0", "11.0.0")).toBe(false);
    expect(gte("10.0.0", "10.1.0")).toBe(false);
    expect(gte("10.0.0", "10.0.1")).toBe(false);
});

test("gte accepts a leading v prefix and partial versions", () => {
    expect(gte("v10.0.0", "10.0.0")).toBe(true);
    expect(gte("10", "10.0.0")).toBe(true);
});

test("gte throws on an invalid version", () => {
    expect(() => gte("abc", "10.0.0")).toThrow(/Invalid version/);
});

test("gte treats a version without prerelease as greater than one with it", () => {
    expect(gte("10.0.0", "10.0.0-beta")).toBe(true);
    expect(gte("10.0.0-beta", "10.0.0")).toBe(false);
});

test("gte compares string prerelease identifiers", () => {
    expect(gte("10.0.0-rc.1", "10.0.0-alpha.2")).toBe(true);
    expect(gte("10.0.0-alpha.2", "10.0.0-beta.1")).toBe(false);
});

test("gte compares numeric prerelease identifiers", () => {
    expect(gte("10.0.0-2", "10.0.0-1")).toBe(true);
    expect(gte("10.0.0-1", "10.0.0-2")).toBe(false);
});

test("gte compares numeric prerelease against string prerelease", () => {
    expect(gte("10.0.0-1", "10.0.0-alpha")).toBe(false);
    expect(gte("10.0.0-alpha", "10.0.0-1")).toBe(true);
});

test("gte compares prereleases of different lengths", () => {
    expect(gte("10.0.0-alpha.1.2", "10.0.0-alpha.1")).toBe(true);
    expect(gte("10.0.0-alpha.1", "10.0.0-alpha.1.2")).toBe(false);
});

test("gte treats equal prerelease identifiers as equal", () => {
    expect(gte("10.0.0-alpha.1", "10.0.0-alpha.1")).toBe(true);
});

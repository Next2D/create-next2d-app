import { test, expect } from "vitest";
import validate from "../src/lib/validate";

test("accepts a valid unscoped package name", () => {
    const r = validate("my-next2d-app");
    expect(r.validForNewPackages).toBe(true);
    expect(r.validForOldPackages).toBe(true);
    expect(r.warnings).toBeUndefined();
    expect(r.errors).toBeUndefined();
});

test("accepts a valid scoped package name", () => {
    const r = validate("@scope/my-app");
    expect(r.validForNewPackages).toBe(true);
    expect(r.errors).toBeUndefined();
});

test("rejects null / undefined / non-string", () => {
    expect(validate(null).validForNewPackages).toBe(false);
    expect(validate(undefined).validForNewPackages).toBe(false);
    expect(validate(123).validForNewPackages).toBe(false);
});

test("rejects an empty name", () => {
    const r = validate("");
    expect(r.validForNewPackages).toBe(false);
    expect(r.errors).toEqual(["name length must be greater than zero"]);
});

test("rejects a name starting with a period", () => {
    const r = validate(".bad");
    expect(r.validForNewPackages).toBe(false);
    expect(r.errors).toContain("name cannot start with a period");
});

test("rejects a name starting with a hyphen", () => {
    const r = validate("-bad");
    expect(r.errors).toContain("name cannot start with a hyphen");
});

test("rejects a name starting with an underscore", () => {
    const r = validate("_bad");
    expect(r.errors).toContain("name cannot start with an underscore");
});

test("rejects names with leading/trailing spaces", () => {
    const r = validate(" foo ");
    expect(r.errors).toContain("name cannot contain leading or trailing spaces");
});

test("rejects reserved names", () => {
    const r = validate("node_modules");
    expect(r.errors).toContain("node_modules is not a valid package name");
    expect(validate("favicon.ico").errors).toContain("favicon.ico is not a valid package name");
});

test("warns on core module names", () => {
    const r = validate("assert");
    expect(r.validForNewPackages).toBe(false);
    expect(r.warnings).toContain("assert is a core module name");
});

test("warns on names over 214 characters", () => {
    const r = validate("a".repeat(215));
    expect(r.warnings).toContain("name can no longer contain more than 214 characters");
});

test("warns on capital letters and special characters", () => {
    const r = validate("MyApp");
    expect(r.warnings).toContain("name can no longer contain capital letters");
    const s = validate("weird~name");
    expect(s.warnings).toContain("name can no longer contain special characters (\"~'!()*\")");
});

test("rejects names with non-URL-friendly characters", () => {
    const r = validate("foo bar");
    expect(r.validForNewPackages).toBe(false);
    expect(r.errors).toContain("name can only contain URL-friendly characters");
});

test("rejects a scoped name whose package part starts with a period", () => {
    const r = validate("@scope/.bad");
    expect(r.validForNewPackages).toBe(false);
    expect(r.errors).toContain("name cannot start with a period");
});

import { test, expect } from "vitest";
import { createIgnoreList, createScripts } from "../src/lib/project-files";

test("every builder script selects a target and a default environment", () => {
    const builderScripts = Object.entries(createScripts())
        .filter(([, command]) => command.startsWith("npx -y @next2d/builder "));
    expect(builderScripts.length).toBeGreaterThan(0);
    for (const [name, command] of builderScripts) {
        const args = command.split(" ");
        expect(args.includes("--platform") || args.includes("--steam-upload"), name).toBe(true);
        expect(args[args.indexOf("--env") + 1], name).toBe("prd");
        expect(command, name).not.toMatch(/ {2}/);
    }
});

test("steam manifest script passes a steam platform", () => {
    expect(createScripts()["build:steam:manifest"]).toContain("--platform steam:");
});

test("template scripts override and extend the defaults", () => {
    const scripts = createScripts({ "lint": "eslint src", "test": "vitest run" });
    expect(scripts.lint).toBe("eslint src");
    expect(scripts.test).toBe("vitest run");
    expect(scripts.start).toBe("vite --host");
});

test("gitignore covers generated files of JavaScript and TypeScript templates and the Xbox host", () => {
    const list = createIgnoreList();
    for (const entry of ["node_modules", "dist", "src/Packages.ts", "src/Packages.js", "src/config/Config.ts", "src/config/Config.js", "/xbox"]) {
        expect(list).toContain(entry);
    }
    expect(list).not.toContain("MicrosoftGame.config");
});

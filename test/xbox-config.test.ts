import { test, expect, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { initializeXboxConfig } from "../src/lib/xbox-config";

const roots: string[] = [];
const fixture = (): string => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "next2d-xbox-config-"));
    roots.push(root);
    return root;
};
afterEach(() => {
    for (const root of roots.splice(0)) {
        fs.rmSync(root, { "recursive": true, "force": true });
    }
});

const CONFIG = `<?xml version="1.0" encoding="utf-8"?>
<Game configVersion="1">
  <Identity Name="Next2DGame" Publisher="CN=Next2D" Version="1.0.0.0" />
  <ShellVisuals DefaultDisplayName="Example-Product-Name"
                PublisherDisplayName="Next2D" />
  <TitleId>00000000</TitleId>
</Game>
`;

test("sets the display name and keeps ID@Xbox values", () => {
    const root = fixture();
    const file = path.join(root, "MicrosoftGame.config");
    fs.writeFileSync(file, CONFIG);
    initializeXboxConfig(root, "my-game");
    expect(fs.readFileSync(file, "utf8")).toBe(CONFIG.replace("Example-Product-Name", "my-game"));
});

test("escapes XML special characters in the display name", () => {
    const root = fixture();
    const file = path.join(root, "MicrosoftGame.config");
    fs.writeFileSync(file, CONFIG);
    initializeXboxConfig(root, "a&\"<b>");
    expect(fs.readFileSync(file, "utf8")).toContain("DefaultDisplayName=\"a&amp;&quot;&lt;b&gt;\"");
});

test("leaves configs without ShellVisuals unchanged", () => {
    const root = fixture();
    const file = path.join(root, "MicrosoftGame.config");
    fs.writeFileSync(file, "<Game />");
    initializeXboxConfig(root, "my-game");
    expect(fs.readFileSync(file, "utf8")).toBe("<Game />");
});

test("custom templates without Xbox configuration remain unchanged", () => {
    const root = fixture();
    initializeXboxConfig(root, "web-game");
    expect(fs.readdirSync(root)).toEqual([]);
});

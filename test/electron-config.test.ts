import { test, expect, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { initializeElectronConfig } from "../src/lib/electron-config";

const roots: string[] = [];
const fixture = (): string => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "next2d-electron-config-"));
    roots.push(root);
    return root;
};
afterEach(() => {
    for (const root of roots.splice(0)) {
        fs.rmSync(root, { "recursive": true, "force": true });
    }
});

test("initializes project identity after template copy and keeps platform settings", () => {
    const root = fixture();
    const config = {
        "appId": "app.example.appId",
        "appName": "Example-Product-Name",
        "executableName": "example-product-name",
        "companyName": "Example Company",
        "icons": {},
        "architectures": { "macos": "universal" },
        "window": { "width": 960, "height": 540, "fullscreen": false },
        "steam": { "appId": null, "depots": { "windows": null, "macos": null, "linux": null } },
        "macos": { "sign": false, "notarize": false }
    };
    fs.writeFileSync(path.join(root, "electron.config.json"), JSON.stringify(config));
    fs.writeFileSync(path.join(root, "package.json"), JSON.stringify({
        "name": "my-game", "version": "0.0.1", "description": "Details of my-game"
    }));

    initializeElectronConfig(root, "my-game");

    expect(JSON.parse(fs.readFileSync(path.join(root, "electron.config.json"), "utf8"))).toEqual({
        ...config,
        "appId": "app.example.my-game", "appName": "my-game", "executableName": "my-game", "companyName": "my-game",
        "architectures": { "windows": "x64", "macos": "universal", "linux": "x64" }
    });
    expect(fs.existsSync(path.join(root, "electron"))).toBe(false);
});

test("normalizes bundle IDs for npm names with underscores and dots", () => {
    const root = fixture();
    fs.writeFileSync(path.join(root, "electron.config.json"), "{}");
    initializeElectronConfig(root, "my_game.v2");
    const config = JSON.parse(fs.readFileSync(path.join(root, "electron.config.json"), "utf8"));
    expect(config.appId).toBe("app.example.my-game-v2");
    expect(config.appName).toBe("my_game.v2");
    expect(config.executableName).toBe("my_game.v2");
    expect(config.architectures).toEqual({ "windows": "x64", "macos": "universal", "linux": "x64" });
});

test("keeps custom ARM64 targets, asset paths and shared Steam Depot IDs", () => {
    const root = fixture();
    const input = {
        "architectures": { "windows": "arm64", "macos": "arm64" },
        "icons": { "windows": "src/assets/icons/icon.ico" },
        "steam": { "appId": 123456, "depots": { "windows": 123457, "macos": 123457 } }
    };
    fs.writeFileSync(path.join(root, "electron.config.json"), JSON.stringify(input));
    initializeElectronConfig(root, "arm-game");
    const config = JSON.parse(fs.readFileSync(path.join(root, "electron.config.json"), "utf8"));
    expect(config.architectures).toEqual({ "windows": "arm64", "macos": "arm64", "linux": "x64" });
    expect(config.icons).toEqual(input.icons);
    expect(config.steam).toEqual(input.steam);
    expect(fs.readdirSync(root)).toEqual(["electron.config.json"]);
});

test("custom templates without Electron configuration remain unchanged", () => {
    const root = fixture();
    initializeElectronConfig(root, "web-game");
    expect(fs.readdirSync(root)).toEqual([]);
});

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

/** Apply project identity after copying a template, preserving its platform settings. */
export const initializeElectronConfig = (root: string, appName: string): void => {
    const configPath = path.join(root, "electron.config.json");
    // Custom templates without Electron support need no desktop configuration.
    if (!fs.existsSync(configPath)) {
        return;
    }
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    // npm permits underscores and dots; a bundle ID component does not permit underscores.
    const identifier = appName.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
    config.appId = `app.example.${identifier}`;
    config.appName = appName;
    config.executableName = appName;
    config.companyName = appName;
    config.architectures = {
        "windows": "x64",
        "macos": "universal",
        "linux": "x64",
        ...config.architectures
    };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + os.EOL);
};

#!/usr/bin/env node

"use strict";

const pc                  = require("picocolors");
const commander           = require("commander");
const packageJson         = require("../package.json");
const path                = require("path");
const validateProjectName = require("validate-npm-package-name");
const execSync            = require("child_process").execSync;
const fs                  = require("fs-extra");
const os                  = require("os");
const semver              = require("semver");
const spawn               = require("cross-spawn");

const recommendeVersion: number = 22;
const version: string = process.versions.node;
if (recommendeVersion > parseInt(version.split(".")[0])) {
    pc.red(`You are running Node Version:${version}.
View Generator requires Node ${recommendeVersion} or higher.
Please update your version of Node.`);
    process.exit(1);
}

/**
 * @type {string}
 * @private
 */
let projectName: string = "";

/**
 * @param  {string} app_name
 * @return {void}
 * @method
 * @public
 */
const checkAppName = (app_name: string): void =>
{
    const validationResult = validateProjectName(app_name);
    if (!validationResult.validForNewPackages) {
        console.error(
            pc.red(
                `Cannot create a project named ${pc.green(
                    `"${app_name}"`
                )} because of npm naming restrictions:\n`
            )
        );
        [
            ...validationResult.errors || [],
            ...validationResult.warnings || []
        ].forEach((error) => {
            console.error(pc.red(`  * ${error}`));
        });
        console.error(pc.red("\nPlease choose a different project name."));
        process.exit(1);
    }

    const dependencies: string[] = [
        "next2d",
        "next2d-player",
        "next2d-framework"
    ].sort();

    if (dependencies.includes(app_name)) {
        console.error(
            pc.red(
                `Cannot create a project named ${pc.green(
                    `"${app_name}"`
                )} because a dependency with the same name exists.\n` +
                "Due to the way npm works, the following names are not allowed:\n\n"
            ) +
            pc.cyan(dependencies.map((depName) => `  ${depName}`).join("\n")) +
            pc.red("\n\nPlease choose a different project name.")
        );
        process.exit(1);
    }
};

/**
 * @return {boolean}
 * @method
 * @public
 */
const checkThatNpmCanReadCwd = (): boolean =>
{
    const cwd: string = process.cwd();
    let childOutput: string = "";
    try {
        childOutput = spawn.sync("npm", ["config", "list"]).output.join("");
    } catch (err) {
        return true;
    }

    if (typeof childOutput !== "string") {
        return true;
    }

    const lines: string[] = childOutput.split("\n");
    const prefix = "; cwd = ";
    const line   = lines.find((line) => line.startsWith(prefix));
    if (typeof line !== "string") {
        return true;
    }

    const npmCWD: string = line.substring(prefix.length);
    if (npmCWD === cwd) {
        return true;
    }

    console.error(
        pc.red(
            "Could not start an npm process in the right directory.\n\n" +
            `The current directory is: ${pc.bold(cwd)}\n` +
            `However, a newly started npm process runs in: ${pc.bold(
                npmCWD
            )}\n\n` +
            "This is probably caused by a misconfigured system terminal shell."
        )
    );

    if (process.platform === "win32") {
        console.error(
            pc.red("On Windows, this can usually be fixed by running:\n\n") +
            `  ${pc.cyan(
                "reg"
            )} delete "HKCU\\Software\\Microsoft\\Command Processor" /v AutoRun /f\n` +
            `  ${pc.cyan(
                "reg"
            )} delete "HKLM\\Software\\Microsoft\\Command Processor" /v AutoRun /f\n\n` +
            pc.red("Try to run the above two lines in the terminal.\n") +
            pc.red(
                "To learn more about this problem, read: https://blogs.msdn.microsoft.com/oldnewthing/20071121-00/?p=24433/"
            )
        );
    }

    return false;
};

interface NpmVersion {
    hasMinNpm: boolean;
    npmVersion: string;
}

/**
 * @return {object}
 * @method
 * @public
 */
const checkNpmVersion = (): NpmVersion =>
{
    let hasMinNpm: boolean = false;
    let npmVersion: string = "0.0.0";

    try {
        npmVersion = execSync("npm --version").toString().trim();
        hasMinNpm  = semver.gte(npmVersion, "6.0.0");
    } catch (err) {
        // ignore
    }

    return {
        "hasMinNpm":  hasMinNpm,
        "npmVersion": npmVersion
    };
};

interface Packages {
    dependencies?: {
        [key: string]: string
    },
    devDependencies?: {
        [key: string]: string
    }
}

interface TemplateJson {
    package? : Packages
}

/**
 * @param  {string} root
 * @param  {string} app_name
 * @param  {string} template
 * @param  {array}  dependencies
 * @param  {array}  devDependencies
 * @return {void}
 */
const install = (
    root: string,
    app_name: string,
    template: string,
    dependencies: string[],
    devDependencies: string[]
): void => {

    console.log("Installing packages. This may take a few minutes.");

    const command: string = "npm";
    new Promise((resolve, reject) =>
    {
        const args: string[] = [
            "install",
            "--no-audit",
            "--save-dev",
            "--loglevel",
            "error",
            template
        ];

        const child = spawn(command, args, { "stdio": "inherit" });
        child
            .on("close", (code: number) =>
            {
                if (code !== 0) {

                    reject({ "command": `${command} ${args.join(" ")}` });
                    process.exit(1);

                } else {

                    console.log();
                    console.log(`Installing template: ${pc.green(template)}`);

                    const templatePath: string = path.dirname(
                        require.resolve(`${template}/package.json`, { "paths": [root] })
                    );

                    const templateJsonPath: string = path.join(templatePath, "template.json");

                    let templateJson: TemplateJson = {};
                    if (fs.existsSync(templateJsonPath)) {
                        templateJson = require(templateJsonPath);
                    }

                    // base package.json
                    const packageJson = require(`${root}/package.json`);

                    // reset
                    packageJson.dependencies    = {};
                    packageJson.devDependencies = {};

                    const templatePackage: Packages | void = templateJson.package;
                    if (templatePackage) {
                        const templateDependencies = templatePackage.dependencies;
                        if (templateDependencies) {
                            const keys: string[] = Object.keys(templateDependencies);
                            for (let idx: number = 0; idx < keys.length; ++idx) {

                                const name = keys[idx];
                                if (templateDependencies[name] === "*") {
                                    devDependencies.push(name);
                                } else {
                                    packageJson.dependencies[name] = templateDependencies[name];
                                }
                            }
                        }

                        const templateDevDependencies = templatePackage.devDependencies;
                        if (templateDevDependencies) {
                            const keys: string[] = Object.keys(templateDevDependencies);
                            for (let idx: number = 0; idx < keys.length; ++idx) {

                                const name = keys[idx];
                                if (templateDevDependencies[name] === "*") {
                                    devDependencies.push(name);
                                } else {
                                    packageJson.devDependencies[name] = templateDevDependencies[name];
                                }
                            }
                        }
                    }

                    fs.writeFileSync(
                        path.join(root, "package.json"),
                        JSON.stringify(packageJson, null, 2) + os.EOL
                    );

                    const templateDir: string = path.join(templatePath, "template");
                    if (fs.existsSync(templateDir)) {
                        fs.copySync(templateDir, root);
                    } else {
                        console.error(
                            `Could not locate supplied template: ${pc.green(templateDir)}`
                        );
                        return;
                    }

                    const args: string[] = [
                        "uninstall",
                        "--no-audit",
                        "--save-dev",
                        "--loglevel",
                        "error",
                        template
                    ];

                    const child = spawn(command, args, { "stdio": "inherit" });
                    child
                        .on("close", (code: number) =>
                        {
                            if (code !== 0) {
                                reject({
                                    "command": `${command} ${args.join(" ")}`
                                });
                                process.exit(1);
                            }

                            // @ts-ignore
                            resolve();
                        });
                }
            });
    })
        .then(() =>
        {
            return new Promise((resolve, reject) =>
            {
                const args: string[] = [
                    "install",
                    "--no-audit",
                    "--save",
                    "--loglevel",
                    "error"
                ].concat(dependencies);

                const child = spawn(command, args, { "stdio": "inherit" });
                child
                    .on("close", (code: number) =>
                    {
                        if (code !== 0) {
                            reject({
                                "command": `${command} ${args.join(" ")}`
                            });
                            process.exit(1);
                        }

                        // @ts-ignore
                        resolve();
                    });
            });

        })
        .then(() =>
        {
            const args: string[] = [
                "install",
                "--no-audit",
                "--save-dev",
                "--loglevel",
                "error"
            ].concat(devDependencies);

            const child = spawn(command, args, { "stdio": "inherit" });
            child
                .on("close", (code: number) =>
                {
                    if (code !== 0) {

                        console.log();
                        console.error(`${command} ${args.join(" ")}`);
                        process.exit(1);

                    } else {

                        console.log();
                        console.log(`Success! Created ${pc.green(app_name)} at ${pc.green(root)}`);

                        console.log();
                        console.log("you can run several commands:");

                        console.log();
                        console.log(`  ${pc.green("npm start")}`);
                        console.log("    Starts the development server.");

                        console.log();
                        console.log(`  ${pc.green("npm run generate")}`);
                        console.log("    Generate the necessary View and ViewModel classes from the routing JSON file.");

                        console.log();
                        console.log(`  ${pc.green("npm test")}`);
                        console.log("    Starts the test runner.");

                        console.log();
                        console.log("We suggest that you begin by typing:");
                        console.log(`  ${pc.green("cd")} ${app_name}`);
                        console.log(`  ${pc.green("npm start")}`);
                        console.log();
                    }
                });
        });
};

/**
 * @param  {string} app_name
 * @param  {string} [template="@next2d/framework-template"]
 * @return {void}
 * @method
 * @public
 */
const createApp = (
    app_name: string,
    template: string = "@next2d/framework-template"
): void => {

    const root: string    = path.resolve(app_name);
    const appName: string = path.basename(root);

    checkAppName(appName);
    fs.ensureDirSync(app_name);

    console.log();
    console.log(`Creating a new Next2D app in ${pc.green(root)}.`);
    console.log();

    fs.writeFileSync(
        path.join(root, "package.json"),
        JSON.stringify({
            "name": appName,
            "description": `Details of ${appName}`,
            "version": "0.0.1",
            "private": true,
            "type": "module",
            "scripts": {
                "start": "vite --host",
                "preview:ios": "npx @next2d/builder --platform ios --preview",
                "preview:android": "npx @next2d/builder --platform android --preview",
                "preview:macos": "npx @next2d/builder --platform macos --preview",
                "preview:windows": "npx @next2d/builder --platform windows --preview",
                "preview:linux": "npx @next2d/builder --platform linux --preview",
                "build:steam:windows": "npx @next2d/builder --platform steam:windows --env prd",
                "build:steam:macos": "npx @next2d/builder --platform steam:macos --env prd",
                "build:steam:linux": "npx @next2d/builder --platform steam:linux --env prd",
                "build:web": "npx @next2d/builder --platform web --env prd",
                "build": "npx @next2d/builder",
                "test": "npx vitest",
                "generate": "npx @next2d/view-generator"
            }
        }, null, 2) + os.EOL
    );

    process.chdir(root);
    if (!checkThatNpmCanReadCwd()) {
        process.exit(1);
    }

    const npmInfo: NpmVersion = checkNpmVersion();
    if (!npmInfo.hasMinNpm) {
        if (npmInfo.npmVersion) {
            console.log(
                pc.yellow(
                    `You are using npm ${npmInfo.npmVersion} so the project will be bootstrapped with an old unsupported version of tools.\n\n` +
                    "Please update to npm 6 or higher for a better, fully supported experience.\n"
                )
            );
        }
    }

    const ignoreList: string[] = [
        "# Logs",
        "logs",
        "*.log",
        "npm-debug.log*",
        "yarn-debug.log*",
        "yarn-error.log*",
        "pnpm-debug.log*",
        "lerna-debug.log*",
        "node_modules",
        "dist",
        "dist-ssr",
        "*.local",
        "# Editor directories and files",
        ".vscode/*",
        "!.vscode/extensions.json",
        ".idea",
        ".DS_Store",
        "*.suo",
        "*.ntvs*",
        "*.njsproj",
        "*.sln",
        "*.sw?",
        "electron/resources"
    ];

    fs.writeFileSync(
        path.join(root, ".gitignore"),
        ignoreList.join(os.EOL)
    );

    install(root, appName, template, ["@next2d/framework"], [
        "@next2d/vite-auto-loader-plugin",
        "jsdom",
        "vite",
        "vitest",
        "@vitest/web-worker",
        "vitest-webgl-canvas-mock",
        "@types/node",
        "@capacitor/cli",
        "@capacitor/core",
        "@capacitor/ios",
        "@capacitor/android"
    ]);
};

/**
 * @return {void}
 * @method
 * @public
 */
const execute = (): void =>
{
    const program = new commander.Command(packageJson.name)
        .version(packageJson.version)
        .arguments("<project-directory>")
        .usage(`${pc.green("<project-directory>")} [options]`)
        .action((name: string) => { projectName = name })
        .option("--info", "print environment debug info")
        .option(
            "--template <path-to-template>",
            "specify a template for the created project"
        )
        .on("-h, --help", () =>
        {
            console.log();
            console.log(`    A custom ${pc.cyan("--template")} can be one of:`);
            console.log(
                `      - a custom template published on npm default: ${pc.green(
                    "@next2d/framework-template"
                )}`
            );

            console.log();
            console.log(
                "    If you have any problems, do not hesitate to file an issue:"
            );
            console.log(
                `      ${pc.cyan(
                    "https://github.com/Next2D/create-next2d-app/issues/new"
                )}`
            );
            console.log();
        })
        .parse(process.argv);

    if (typeof projectName === "undefined") {

        console.error("Please specify the project directory:");
        console.log(
            `  npx ${pc.cyan(program.name())} ${pc.green("<project-directory>")}`
        );
        console.log();
        console.log("For example:");
        console.log(
            `  npx ${pc.cyan(program.name())} ${pc.green("my-next2d-app")}`
        );
        process.exit(1);
    }

    const options = program.opts();
    createApp(projectName, options.template);
};

execute();

#!/usr/bin/env node

"use strict";

const version: number = +process.versions.node.split(".")[0];

if (15 > version) {
    console.error(
        "You are running Node Version:" + version + ".\n" +
        "Create Next2d App requires Node 15 or higher. \n" +
        "Please update your version of Node."
    );
    process.exit(1);
}

const chalk               = require("chalk");
const commander           = require("commander");
const execSync            = require("child_process").execSync;
const fs                  = require("fs-extra");
const os                  = require("os");
const path                = require("path");
const semver              = require("semver");
const spawn               = require("cross-spawn");
const validateProjectName = require("validate-npm-package-name");
const packageJson        = require("../package.json");

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
            chalk.red(
                `Cannot create a project named ${chalk.green(
                    `"${app_name}"`
                )} because of npm naming restrictions:\n`
            )
        );
        [
            ...validationResult.errors || [],
            ...validationResult.warnings || []
        ].forEach((error) => {
            console.error(chalk.red(`  * ${error}`));
        });
        console.error(chalk.red("\nPlease choose a different project name."));
        process.exit(1);
    }

    const dependencies: string[] = [
        "next2d",
        "next2d-player",
        "next2d-framework"
    ].sort();

    if (dependencies.includes(app_name)) {
        console.error(
            chalk.red(
                `Cannot create a project named ${chalk.green(
                    `"${app_name}"`
                )} because a dependency with the same name exists.\n` +
                "Due to the way npm works, the following names are not allowed:\n\n"
            ) +
            chalk.cyan(dependencies.map((depName) => `  ${depName}`).join("\n")) +
            chalk.red("\n\nPlease choose a different project name.")
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
        chalk.red(
            "Could not start an npm process in the right directory.\n\n" +
            `The current directory is: ${chalk.bold(cwd)}\n` +
            `However, a newly started npm process runs in: ${chalk.bold(
                npmCWD
            )}\n\n` +
            "This is probably caused by a misconfigured system terminal shell."
        )
    );

    if (process.platform === "win32") {
        console.error(
            chalk.red("On Windows, this can usually be fixed by running:\n\n") +
            `  ${chalk.cyan(
                "reg"
            )} delete "HKCU\\Software\\Microsoft\\Command Processor" /v AutoRun /f\n` +
            `  ${chalk.cyan(
                "reg"
            )} delete "HKLM\\Software\\Microsoft\\Command Processor" /v AutoRun /f\n\n` +
            chalk.red("Try to run the above two lines in the terminal.\n") +
            chalk.red(
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
 * @return {void}
 */
const install = (
    root: string,
    app_name: string,
    template: string,
    dependencies: string[]
): void => {

    console.log("Installing packages. This may take a few minutes.");

    const command: string = "npm";
    new Promise((resolve, reject) =>
    {
        const args: string[] = [
            "install",
            "--no-audit",
            "--save",
            "--save-exact",
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
                    console.log(`Installing template: ${chalk.green(template)}`);

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

                    const templatePackage: Packages | void = templateJson.package;
                    if (templatePackage) {
                        const templateDependencies = templatePackage.dependencies;
                        if (templateDependencies) {
                            const keys: string[] = Object.keys(templateDependencies);
                            for (let idx: number = 0; idx < keys.length; ++idx) {

                                const name = keys[idx];
                                if (templateDependencies[name] === "*") {
                                    dependencies.push(name);
                                } else {
                                    packageJson.dependencies[name] = templateDependencies[name];
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
                            `Could not locate supplied template: ${chalk.green(templateDir)}`
                        );
                        return;
                    }

                    const args: string[] = [
                        "uninstall",
                        "--no-audit",
                        "--save",
                        "--save-exact",
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
            const args: string[] = [
                "install",
                "--no-audit",
                "--save",
                "--save-exact",
                "--loglevel",
                "error"
            ].concat(dependencies);

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
                        console.log(`Success! Created ${chalk.green(app_name)} at ${chalk.green(root)}`);

                        console.log();
                        console.log("you can run several commands:");

                        console.log();
                        console.log(`  ${chalk.green("npm start")}`);
                        console.log("    Starts the development server.");

                        console.log();
                        console.log(`  ${chalk.green("npm run generate")}`);
                        console.log("    Generate the necessary View and ViewModel classes from the routing JSON file.");

                        console.log();
                        console.log(`  ${chalk.green("npm run [ios|android|windows|macos] -- --env prd")}`);
                        console.log("    Start the emulator for each platform.");

                        console.log();
                        console.log(`  ${chalk.green("npm run build -- --platform [windows|macos|web] --env prd")}`);
                        console.log("    Export a production version for each platform.");

                        console.log();
                        console.log(`  ${chalk.green("npm test")}`);
                        console.log("    Starts the test runner.");

                        console.log();
                        console.log("We suggest that you begin by typing:");
                        console.log(`  ${chalk.green("cd")} ${app_name}`);
                        console.log(`  ${chalk.green("npm start")}`);
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
    console.log(`Creating a new Next2D app in ${chalk.green(root)}.`);
    console.log();

    fs.writeFileSync(
        path.join(root, "package.json"),
        JSON.stringify({
            "name": appName,
            "description": `Details of ${appName}`,
            "version": "0.0.1",
            "private": true,
            "main": "src/index.js",
            "scripts": {
                "start": "webpack serve",
                "ios": "npx @next2d/builder run ios --platform ios --debug",
                "android": "npx @next2d/builder run android --platform android --debug",
                "macos": "npx @next2d/builder --platform macos --debug",
                "windows": "npx @next2d/builder --platform windows --debug",
                "build": "npx @next2d/builder",
                "lint": "eslint src/**/*.js",
                "test": "npx jest",
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
                chalk.yellow(
                    `You are using npm ${npmInfo.npmVersion} so the project will be bootstrapped with an old unsupported version of tools.\n\n` +
                    "Please update to npm 6 or higher for a better, fully supported experience.\n"
                )
            );
        }
    }

    const ignoreList: string[] = [
        "node_modules",
        "coverage",
        "dist",
        ".DS_Store",
        ".idea",
        "Thumbs.db",
        "npm-debug.log*",
        "yarn-debug.log*",
        "yarn-error.log*",
        "src/config/Config.js",
        "src/Packages.js",
        "electron.index.json"
    ];

    fs.writeFileSync(
        path.join(root, ".gitignore"),
        ignoreList.join(os.EOL)
    );

    install(root, appName, template, [
        "@next2d/framework",
        "@next2d/env",
        "electron",
        "webpack",
        "webpack-cli",
        "webpack-dev-server",
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
        .usage(`${chalk.green("<project-directory>")} [options]`)
        .action((name: string) => { projectName = name })
        .option("--info", "print environment debug info")
        .option(
            "--template <path-to-template>",
            "specify a template for the created project"
        )
        .on("--help", () =>
        {
            console.log();
            console.log(`    A custom ${chalk.cyan("--template")} can be one of:`);
            console.log(
                `      - a custom template published on npm default: ${chalk.green(
                    "@next2d/framework-template"
                )}`
            );

            console.log();
            console.log(
                "    If you have any problems, do not hesitate to file an issue:"
            );
            console.log(
                `      ${chalk.cyan(
                    "https://github.com/Next2D/create-next2d-app/issues/new"
                )}`
            );
            console.log();
        })
        .parse(process.argv);

    if (typeof projectName === "undefined") {

        console.error("Please specify the project directory:");
        console.log(
            `  npx ${chalk.cyan(program.name())} ${chalk.green("<project-directory>")}`
        );
        console.log();
        console.log("For example:");
        console.log(
            `  npx ${chalk.cyan(program.name())} ${chalk.green("my-next2d-app")}`
        );
        process.exit(1);
    }

    createApp(projectName, program.template);
};

execute();

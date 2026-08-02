/**
 * A minimal drop-in replacement for the `commander` API used by this tool.
 *
 * Reproduces the observable behavior of commander 15.0.0 for the specific
 * usage in `src/index.ts` (a single command with a required positional
 * argument, a version option, a couple of options, and help).
 */

interface Option {
    flags: string;
    description: string;
}

class Command {
    private name_: string;
    private version_: string = "";
    private arguments_: string[] = [];
    private usage_: string = "";
    private action_: ((...args: string[]) => void) | undefined;
    private options_: Option[] = [];
    private events_: Map<string, Array<() => void>> = new Map();
    private parsedOptions_: Record<string, string | boolean> = {};

    constructor(name: string) {
        this.name_ = name;
    }

    name(): string {
        return this.name_;
    }

    version(value: string): this {
        this.version_ = value;
        this.options_.push({
            "flags": "-V, --version",
            "description": "output the version number"
        });
        return this;
    }

    arguments(value: string): this {
        this.arguments_ = value.split(/\s+/).filter((item) => item.length > 0);
        return this;
    }

    usage(value: string): this {
        this.usage_ = value;
        return this;
    }

    action(fn: (...args: string[]) => void): this {
        this.action_ = fn;
        return this;
    }

    option(flags: string, description: string): this {
        this.options_.push({ flags, description });
        return this;
    }

    on(event: string, fn: () => void): this {
        const handlers = this.events_.get(event);
        if (handlers) {
            handlers.push(fn);
        } else {
            this.events_.set(event, [fn]);
        }
        return this;
    }

    opts(): Record<string, string | boolean> {
        return this.parsedOptions_;
    }

    parse(argv: string[]): this {
        const args: string[] = argv.slice(2);
        const positionals: string[] = [];
        let onlyPositionals: boolean = false;

        for (let i = 0; i < args.length; ++i) {
            const arg = args[i];

            if (onlyPositionals) {
                positionals.push(arg);
                continue;
            }

            if (arg === "--") {
                onlyPositionals = true;
                continue;
            }

            if (arg === "-V" || arg === "--version") {
                console.log(this.version_);
                process.exit(0);
            }

            if (arg === "-h" || arg === "--help") {
                this.displayHelp();
                process.exit(0);
            }

            if (arg === "--info") {
                this.parsedOptions_.info = true;
                continue;
            }

            if (arg.startsWith("--template")) {
                const equals = arg.indexOf("=");
                if (equals !== -1) {
                    this.parsedOptions_.template = arg.substring(equals + 1);
                } else {
                    this.parsedOptions_.template = args[++i];
                }
                continue;
            }

            if (arg.startsWith("--")) {
                const equals = arg.indexOf("=");
                const name = equals === -1 ? arg : arg.substring(0, equals);
                this.error(`unknown option '${name}'`);
            }

            if (arg.startsWith("-") && arg !== "-") {
                this.error(`unknown option '${arg}'`);
            }

            positionals.push(arg);
        }

        if (this.arguments_.length > 0 &&
            this.arguments_.every((item) => item.startsWith("<")) &&
            positionals.length === 0) {
            const name = this.arguments_[0].replace(/[<>]/g, "");
            console.error(`error: missing required argument '${name}'`);
            process.exit(1);
        }

        if (this.action_) {
            this.action_(...positionals);
        }

        return this;
    }

    private error(message: string): never {
        console.error(`error: ${message}`);
        process.exit(1);
    }

    private emit(event: string): void {
        const handlers = this.events_.get(event);
        if (handlers) {
            for (const handler of handlers) {
                handler();
            }
        }
    }

    private displayHelp(): void {
        const usage: string =
            this.usage_ ? `${this.usage_}` : "[options]";

        console.log(`Usage: ${this.name_} ${usage}`);
        console.log();
        console.log("Options:");

        const flags: Option[] = [
            ...this.options_,
            { "flags": "-h, --help", "description": "display help for command" }
        ];

        const maxLen: number = flags.reduce(
            (max, option) => Math.max(max, option.flags.length),
            0
        );

        for (const option of flags) {
            console.log(
                `  ${option.flags.padEnd(maxLen)}  ${option.description}`
            );
        }
        console.log();

        this.emit("-h, --help");
        this.emit("--help");
        this.emit("afterHelp");
    }
}

export default Command;

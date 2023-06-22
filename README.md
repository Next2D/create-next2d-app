Create Next2D App
=============

[![CodeQL](https://github.com/Next2D/create-next2d-app/actions/workflows/codeql-analysis.yml/badge.svg?branch=main)](https://github.com/Next2D/create-next2d-app/actions/workflows/codeql-analysis.yml)
[![Lint](https://github.com/Next2D/create-next2d-app/actions/workflows/lint.yml/badge.svg?branch=main)](https://github.com/Next2D/create-next2d-app/actions/workflows/lint.yml)
[![release](https://img.shields.io/github/v/release/Next2D/create-next2d-app)](https://github.com/Next2D/create-next2d-app/releases)
[![license](https://img.shields.io/github/license/Next2D/create-next2d-app)](https://github.com/Next2D/create-next2d-app/blob/main/LICENSE)

Create Next2D apps with no build configuration.

## Quick Start

```sh
npx create-next2d-app app-test
cd app-test
npm start
```

## Commands

* Starts the development server.
```sh
npm start
```

* Generate the necessary View and ViewModel classes from the routing JSON file.
```sh
npm run generate
```

* Start the emulator for each platform.
```sh
npm run [ios|android|windows|macos] -- --env prd
```

* Export a production version for each platform.
```sh
npm run build -- --platform [windows|macos|web] --env prd
```

* Starts the test runner.
```sh
npm test
```

## License
This project is licensed under the [MIT License](https://opensource.org/licenses/MIT) - see the [LICENSE](LICENSE) file for details.
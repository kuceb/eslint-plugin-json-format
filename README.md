# @cypress/eslint-plugin-json

[![CircleCI](https://circleci.com/gh/cypress-io/eslint-plugin-json.svg?style=svg)](https://circleci.com/gh/cypress-io/eslint-plugin-json)

Lint and autofix your `json` with `eslint`

## Features

- lint and auto-fix `json` files (files ending with `.json` or `rc`)
- auto-sort `package.json` files (default `true`, can be disabled)
- ignores `json-with-comments` files (default `["**/.tsconfig.json", ".vscode/**"]`)
- ignores certain files by default (default `["**/package-lock.json"]`)

## Installation

You'll first need to install [ESLint](http://eslint.org):

```sh
npm i eslint --save-dev
```

Next, install `@cypress/eslint-plugin-json`:

```sh
npm install @cypress/eslint-plugin-json --save-dev
```

## Usage

Add `@cypress/json` to the plugins section of your `.eslintrc` configuration file. You can omit the `eslint-plugin-` prefix:

```json
{
  "plugins": [
    "@cypress/json"
  ]
}
```

**cli example**:
```sh
# lint entire poject for js and various json files
eslint --ext .js,.json,.eslintrc,.babelrc --fix .
```

> Note: **In order to lint hidden files** (e.g. `.eslintrc`, `.bashrc`), you'll need to modify/create a `.eslintignore` in your project root with these contents:
`.eslintignore`:
```gitignore
# eslint ignores hidden files by default
!.*
```

## Configuration

### default configuration** (`.eslintrc`):
```json
"settings": {
  "json/sort-package-json": true,
  "json/ignore-files": ["**/package-lock.json"],
  "json/json-with-comments-files": ["**/tsconfig.json", ".vscode/**"],
}
```
> Note: glob patterns use [`minimatch`](https://github.com/isaacs/minimatch/) against pathnames relative to the project root (cwd)

### examples:

to turn off `sort-package-json` for example, in your `.eslintrc`:
```json
{
  "plugins": [
    "@cypress/json"
  ],
  "settings": {
    "json/sort-package-json": false,
  }
}
```

to format `tsconfig.json` (this will strip comments!), in your `.eslintrc`:
```json
{
  "plugins": [
    "@cypress/json"
  ],
  "settings": {
    "json/json-with-comments-files": [],
  }
}
```

## Editor Configuration

**VSCode**:

In order for editor integration via the [`vscode-eslint`](https://github.com/microsoft/vscode-eslint) extension, you'll need to enable linting `json` files.

`settings.json`:
```json
// enable eslint fix-on-save
  "eslint.autoFixOnSave": true,
  "eslint.validate": [
    {
      "language": "json",
      "autoFix": true
    },
```

> to auto-format `json-with-comments-files`, also add `"language": "jsonc"`

## License
[MIT](/LICENSE.md)

## Credits

large amount of code borrowed from [`eslint-plugin-html`](https://github.com/BenoitZugmeyer/eslint-plugin-html)

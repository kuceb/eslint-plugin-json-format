<div align="center">
    <img width="150" height="150" src="docs/logo.svg">
    <h1>eslint-plugin-json-format</h1>
    <a href="https://circleci.com/gh/Bkucera/eslint-plugin-json-format"><img alt="CircleCI" src="https://img.shields.io/circleci/build/gh/Bkucera/eslint-plugin-json-format"></a>
    <a href="https://www.npmjs.com/package/eslint-plugin-json-format"><img src="https://img.shields.io/npm/v/eslint-plugin-json-format.svg?style=flat"></a>
    <a href="https://www.npmjs.com/package/eslint-plugin-json-format"><img src="https://img.shields.io/npm/dm/eslint-plugin-json-format.svg"></a>
    <a href="https://github.com/bkucera/eslint-plugin-json-format/blob/master/LICENSE"><img src="https://img.shields.io/github/license/bkucera/eslint-plugin-json-format.svg"></a>
    <p>An <a href="http://eslint.org">ESLint</a> plugin to lint, format, auto-fix, and sort your <code>json</code> files.</p>

</div>

## Features

- lint, format, and auto-fix `json` files (files ending with `.json` or `rc`)
- auto-sort `package.json` files (default `true`, can be disabled and sorting configured)
- ignores `json-with-comments` files (default `["**/.tsconfig.json", ".vscode/**"]`)
- ignores certain files by default (default `["**/package-lock.json"]`)

## Installation

You'll first need to install [ESLint](http://eslint.org):

```sh
npm install eslint --save-dev
```

Next, install `eslint-plugin-json-format`:

```sh
npm install eslint-plugin-json-format --save-dev
```

## Usage

Add `json-format` to the plugins section of your `.eslintrc` configuration file. You can omit the `eslint-plugin-` prefix:

```json
{
  "plugins": [
    "json-format"
  ]
}
```

**cli example**:
```sh
# lint entire poject for js and various json files
eslint --ext .js,.json,.eslintrc,.babelrc --fix .
```

> Note: **In order to lint hidden files** (e.g. `.eslintrc.json`), you'll need to modify/create a `.eslintignore` in your project root with these contents:
`.eslintignore`:
```gitignore
# eslint ignores hidden files by default
!.*
**/node_modules
```

## Settings

### default settings (`.eslintrc`):
```json
"settings": {
  "json/sort-package-json": "standard",
  "json/ignore-files": ["**/package-lock.json"],
  "json/json-with-comments-files": ["**/tsconfig.json", ".vscode/**"],
}
```
> Note: glob patterns use [`minimatch`](https://github.com/isaacs/minimatch/) against path names relative to the project root (cwd)

### `sort-package-json` order
You can configure the exact sort order of your `package.json` files (or turn it off entirely with `false`)

#### Available sorting options

**false**: disable `package.json` sorting.

**"standard"**: default from [`sort-package-json`](https://github.com/keithamus/sort-package-json). This is a sane, standard order.

**"pro"**: places scripts and dependencies at the top, reducing need to scroll down to view them. Pros only.

**["your", "custom", "order", "here"]**: provide an array to manually set the sort order.

### Settings examples

to turn off sorting `package.json` files for example, in your `.eslintrc`:
```json
{
  "plugins": [
    "json-format"
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
    "json-format"
  ],
  "settings": {
    "json/json-with-comments-files": [],
  }
}
```

change the sort order of `package.json`:
```json
{
  "plugins": [
    "json-format"
  ],
  "settings": {
    "json/package-json-sort-order": ["license", "dependencies"],
  }
}
```

## Editor Configuration

**VSCode**:

In order for editor integration via the [`vscode-eslint`](https://github.com/microsoft/vscode-eslint) extension, you'll need to enable linting `json` files.

`.vscode/settings.json`:
```jsonc
{
// enble eslint fix-on-save
  "eslint.validate": ["json"],
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
        "source.fixAll.eslint": true
    },
  "eslint.enable": true
 }
```

> to auto-format* `json-with-comments-files`, also add `"eslint.validate": ["jsonc"]` (* will strip comments)

## License
[MIT](/LICENSE.md)

## Credits

large amount of code borrowed from [`eslint-plugin-html`](https://github.com/BenoitZugmeyer/eslint-plugin-html)

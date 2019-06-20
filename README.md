# @cypress/eslint-plugin-json

Lint and autofix your `json` with `eslint`

## Features

- lint and auto-fix `json` files (files ending with `.json` or `rc`)
- auto-sort `package.json` files (default `true`, can be disabled)
- leaves configured `json-with-comments` files alone (default `[.tsconfig.json]`, can be configured)

## Installation

You'll first need to install [ESLint](http://eslint.org):

```
$ npm i eslint --save-dev
```

Next, install `@cypress/eslint-plugin-json`:

```
$ npm install @cypress/eslint-plugin-json --save-dev
```

**Note:** If you installed ESLint globally (using the `-g` flag) then you must also install `@cypress/eslint-plugin-json` globally.

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

## Configuration

**default configuration** (`.eslintrc`):
```json
"settings": {
  "json/sort-package-json": true,
  "json/json-with-comments-filenames": ["tsconfig.json"]
}
```

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

**In order to lint hidden files** (e.g. `.eslintrc`, `.bashrc`), you'll need to modify/create a `.eslintignore` in your project root with these contents:

`.eslintignore`:
```gitignore
// eslint ignores hidden files by default
!.*
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


## License
[MIT](/LICENSE.md)

## Credits

large amount of code borrowed from [`eslint-plugin-html`](https://github.com/BenoitZugmeyer/eslint-plugin-html)

const _ = require('lodash')
const JSON5 = require('json5')
const minimatch = require('minimatch')
const path = require('path')
const sortPackageJSON = require('sort-package-json')
// const debug = require('debug')('json/utils')

const initializeEslintPlugin = ({ pluginName, onPatchVerify }) => {

  const LINTER_ISPATCHED_PROPERTY_NAME = `__eslint-plugin-${pluginName}-format-verify-function-is-patched`

  const needles = [
    path.join('lib', 'linter', 'linter.js'), // ESLint 5-
    path.join('lib', 'linter.js'), // ESLint 6+
  ]

  iterateESLintModules(patch)

  function getLinterFromModule (moduleExports) {
    return moduleExports.Linter ? moduleExports.Linter : moduleExports
  }

  function getModuleFromRequire () {
    return getLinterFromModule(require('eslint/lib/linter'))
  }

  function getModuleFromCache (key) {
    if (!needles.some((needle) => key.endsWith(needle))) return

    const module = require.cache[key]

    if (!module || !module.exports) return

    const Linter = getLinterFromModule(module.exports)

    if (
      typeof Linter === 'function' &&
  typeof Linter.prototype.verify === 'function'
    ) {
      return Linter
    }
  }

  function iterateESLintModules (fn) {
    if (!require.cache || Object.keys(require.cache).length === 0) {
      // Jest is replacing the node "require" function, and "require.cache" isn't available here.
      const _module = getModuleFromRequire()

      if (_module) {
        fn(_module)

        return
      }
    }

    let found = false

    for (const key in require.cache) {
      const Linter = getModuleFromCache(key)

      if (Linter) {
        fn(Linter)
        found = true
      }
    }

    if (!found) {
      throwError('It seems that eslint is not loaded.')
    }
  }

  function patch (Linter) {
    const verifyMethodName = Linter.prototype._verifyWithoutProcessors
      ? '_verifyWithoutProcessors' // ESLint 6+
      : 'verify' // ESLint 5-
    const verify = Linter.prototype[verifyMethodName]

    // ignore if verify function is already been patched sometime before
    if (Linter[LINTER_ISPATCHED_PROPERTY_NAME] === true) {
      return
    }

    Linter[LINTER_ISPATCHED_PROPERTY_NAME] = true
    Linter.prototype[verifyMethodName] = onPatchVerify(verify)
  }

}

const _sortOrder = _.clone(sortPackageJSON.sortOrder)

const sortPkgJSON = (jsonObj, pkgSortOrder) => {

  _.remove(sortPackageJSON.sortOrder)

  _.each(_.union(pkgSortOrder, _sortOrder), (v) => sortPackageJSON.sortOrder.push(v))

  return sortPackageJSON(jsonObj)
}

function oneLine (parts) {
  return parts
  .map((part, index) => {
    return index > 0 ? arguments[index - 1] + part : part
  })
  .join('')
  .trim()
  .split('\n')
  .map((line) => line.trim())
  .join(' ')
}

function splatSet (items) {
  const set = new Set()

  splatSetRec(items, set)

  return set
}

function splatSetRec (items, set) {
  if (items instanceof Array || items instanceof Set) {
    for (const item of items) splatSetRec(item, set)
  } else {
    set.add(items)
  }
}

const throwError = (message) => {
  let eslintPath; let eslintVersion

  try {
    eslintPath = require.resolve('eslint')
  } catch (e) {
    eslintPath = '(not found)'
  }
  try {
    eslintVersion = require('eslint/package.json').version
  } catch (e) {
    eslintVersion = 'n/a'
  }

  const parentPaths = (module) => {
    return module ? [module.filename].concat(parentPaths(module.parent)) : []
  }

  throw new Error(
    `@cypress/eslint-plugin-json error: ${message}

Debugging Information:
* ESLint version: ${eslintVersion}
* ESLint path: ${eslintPath}
* Plugin version: ${require('../package.json').version}
* Plugin inclusion paths: ${parentPaths(module).join(', ')}
* NodeJS version: ${process.version}
* CLI arguments: ${JSON.stringify(process.argv)}
* Content of your lock file (package-lock.json or yarn.lock) or the output of \`npm list\`
* How did you run ESLint (via the command line? an editor plugin?)
* The following stack trace:
  ${new Error().stack.slice(10)}


    `
  )
}

const includesFile = (fileList, file) => {
  return _.some(fileList, (v) => {

    return minimatch(file, v)
  })
}

const formatJSON = (obj) => `${JSON.stringify(obj, null, 2)}\n`

const parseJSON = (source) => {
  let parsed

  try {
    parsed = JSON5.parse(source)
  } catch (e) {
    try {
      const _source = source.replace(/(["'\w]\s*)(?!<,)$/gm, '$1,')

      parsed = parseJSON(_source)
    } catch (__) {
      throw e
    }

  }

  return parsed
}

module.exports = {
  oneLine,
  includesFile,
  splatSet,
  formatJSON,
  parseJSON,
  sortPkgJSON,
  initializeEslintPlugin,
}

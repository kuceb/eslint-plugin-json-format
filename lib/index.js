const path = require('path')
const debug = require('debug')('json')
const _ = require('lodash')
const lineColumn = require('line-column')
const { getSettings } = require('./settings')
const { parseJSON, formatJSON, sortPkgJSON } = require('./utils')

const LINTER_ISPATCHED_PROPERTY_NAME =
  '__eslint-plugin-json-format-verify-function-is-patched'

const Diff = require('diff')

const needle = path.join('lib', 'linter.js')

iterateESLintModules(patch)

function getLinterFromModule (moduleExports) {
  return moduleExports.Linter ? moduleExports.Linter : moduleExports
}

function getModuleFromRequire () {
  return getLinterFromModule(require('eslint/lib/linter'))
}

function getModuleFromCache (key) {
  if (!key.endsWith(needle)) return

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
    fn(getModuleFromRequire())

    return
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

    const parentPaths = (module) =>
      module ? [module.filename].concat(parentPaths(module.parent)) : []

    throw new Error(
      `@cypress/eslint-plugin-json error: It seems that eslint is not loaded.

In the report, please include *all* those informations:

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
}

function getMode (pluginSettings, filenameOrOptions) {

  const filename =
    typeof filenameOrOptions === 'object'
      ? filenameOrOptions.filename
      : filenameOrOptions
  const extension = path.extname(filename || '')

  debug({ extension })

  debug({ pluginSettings })

  const basename = path.basename(filename)

  debug({ basename }, pluginSettings.JSONCommentsFilenames[0])

  if ((pluginSettings.JSONCommentsFilenames || []).includes(basename)) {
    debug('IGNORED COMMENTS FILE', basename)

    return {
      message: `[@cypress/eslint-plugin-json]: Skipping file due to "json/json-with-comments-filenames" setting: 
      ${pluginSettings.JSONCommentsFilenames.join(', ')}
    `,
    }
  }

  if (pluginSettings.sortPackageJson) {
    if (basename === 'package.json' || basename === '__package.json') {
      return 'package-json'
    }
  }

  if (!extension) {
    if (filename.endsWith('rc')) {
      return 'json'
    }
  }

  if (_.includes(['.json'], extension)) {
    return 'json'

  }
}

function patch (Linter) {
  const verify = Linter.prototype.verify

  // ignore if verify function is already been patched sometime before
  if (Linter[LINTER_ISPATCHED_PROPERTY_NAME] === true) {
    return
  }

  Linter[LINTER_ISPATCHED_PROPERTY_NAME] = true
  Linter.prototype.verify = function (
    textOrSourceCode,
    config,
    filenameOrOptions,
    saveState
  ) {
    if (typeof config.extractConfig === 'function') {
      return verify.call(this, textOrSourceCode, config, filenameOrOptions)
    }

    const pluginSettings = getSettings(config.settings || {})

    const mode = getMode(pluginSettings, filenameOrOptions)

    debug({ mode })

    if (_.isObject(mode)) return [mode]

    if (!mode || typeof textOrSourceCode !== 'string') {
      const ret = verify.call(
        this,
        textOrSourceCode,
        config,
        filenameOrOptions,
        saveState
      )

      debug('verify:', ret)

      return ret
    }

    const source = textOrSourceCode

    debug({ source })

    let parsed

    try {
      parsed = parseJSON(source)
    } catch (e) {

      const res = /JSON5: (.*?) at (\d+):(\d+)/.exec(e.message)

      let line = 1
      let col = 1
      let message = e.message

      if (res) {
        debug(res[1], res[2])
        line = res[2]
        col = res[3]
        message = res[1]
      }

      const ret = {
        ruleId: null,
        fatal: true,
        message,
        'severity': 2,
        line,
        'column': col,
      }

      debug({ ret })

      return [ret]

    }
    debug({ parsed })

    let formatted = `${formatJSON(parsed)}\n`

    debug({ formatted })

    let fixes = getFixes(source, formatted)

    if (mode === 'package-json') {
      const sorted = `${formatJSON(sortPkgJSON(parsed))}\n`

      if (sorted !== formatted) {

        fixes.push({
          line: 1,
          column: 1,
          ruleId: 'JSON sorting',
          severity: 'error',
          message: 'JSON is not sorted',
          fix: {
            range: [
              0, textOrSourceCode.length,
            ],
            text: sorted,

          },
        })
      }
    }

    debug({ fixes })

    return fixes

  }
}

const getFixes = (source, formatted) => {

  const diff = Diff.diffChars(source, formatted)

  debug({ diff })

  let index = 0

  let fixes = []

  _.each(diff, (d) => {

    const valEscaped = d.value ? JSON.stringify(d.value) : ''

    if (!d.added && !d.removed) {
      index += d.count

      fixes = fixes.concat([false])

      return
    }

    let lineCol = lineColumn(source, index)

    if (!lineCol) {
      return
    }

    const { line, col } = lineCol

    const prevFix = fixes.slice(-1)[0]

    if (d.added) {

      if (prevFix && prevFix.d.removed && !prevFix.fix.text) {

        prevFix.fix.text = d.value
        index = prevFix.fix.range[1]// + prevFix.fix.text.length

        return
      }
    }

    const startIndex = d.removed ? index : index
    const endIndex = d.removed ? startIndex + d.count : startIndex

    if (d.removed) {
      index = endIndex
    }

    fixes = fixes.concat([{
      line,
      column: col,
      ruleId: 'JSON plugin',
      severity: 'error',
      message: d.removed ? `unexpected ${valEscaped}` : `expected ${valEscaped} `,
      fix: {
        range: [
          startIndex, endIndex,
        ],
        text: d.removed ? '' : d.value,

      },
      d,
    }])

    return
  })

  fixes = _.compact(fixes)

  return fixes.slice(0)

}

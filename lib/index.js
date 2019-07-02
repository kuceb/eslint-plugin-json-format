const _ = require('lodash')
const debug = require('debug')('json')
const Diff = require('diff')
const lineColumn = require('line-column')
const path = require('path')
const { getSettings, SETTINGS } = require('./settings')
const { parseJSON, formatJSON, sortPkgJSON, initializeEslintPlugin, includesFile } = require('./utils')
const { stripIndent } = require('common-tags')

const pluginName = 'json'

initializeEslintPlugin({
  pluginName,
  onPatchVerify:
  (verify) => {
    return function (
      textOrSourceCode,
      config,
      filenameOrOptions,
      saveState
    ) {
      if (typeof config.extractConfig === 'function') {
        return verify.call(this, textOrSourceCode, config, filenameOrOptions)
      }

      let messages = []

      const { pluginSettings, warnings, errors } = getSettings(config.settings || {})

      messages = messages.concat(warnings)
      messages = messages.concat(errors)

      const mode = getMode(pluginSettings, filenameOrOptions)

      debug({ mode })

      if (_.isObject(mode)) {
        messages = messages.concat([mode])

        return messages
      }

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

      const formatted = formatJSON(parsed)

      debug({ formatted })

      let fixes = getFixes(source, formatted)

      if (mode === 'package-json') {
        const sorted = formatJSON(sortPkgJSON(parsed, pluginSettings['package-json-sort-order']))

        if (sorted !== formatted) {

          fixes.push({
            line: 1,
            column: 1,
            ruleId: 'JSON sorting',
            severity: 2,
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

      messages = messages.concat(fixes)

      return messages

    }
  },
})

function getMode (pluginSettings, filenameOrOptions) {

  const _filename =
    typeof filenameOrOptions === 'object'
      ? filenameOrOptions.filename
      : filenameOrOptions

  // takes care of win32 paths by turing some\file\path into some/file/path
  const filename = path.relative(process.cwd(), _filename).replace(/\\/g, '/')
  const extension = path.extname(filename || '')

  debug({ extension })

  debug({ pluginSettings })

  const basename = path.basename(filename)

  if (includesFile(pluginSettings[SETTINGS['json-with-comments-files']], filename)) {
    debug('ignored file due to json-with-comments-files', basename)

    return {
      message: stripIndent`
      [@cypress/eslint-plugin-json]: Skipping file due to "json/${SETTINGS['json-with-comments-files']}" setting: 
        [${pluginSettings[SETTINGS['json-with-comments-files']].map((v) => `"${v}"`).join(', ')}]
      To remove this warning add "${filename}" to your \`.eslintignore\` file
    `,
    }
  }

  if (includesFile(pluginSettings[SETTINGS['ignore-files']], filename)) {
    debug('ignored file', basename)

    return {
      message: stripIndent`
      [@cypress/eslint-plugin-json]: Skipping file due to "json/${SETTINGS['ignore-files']}" setting: 
        [${pluginSettings[SETTINGS['ignore-files']].map((v) => `"${v}"`).join(', ')}]
      To remove this warning add "${filename}" to your \`.eslintignore\` file
    `,
    }
  }

  if (pluginSettings[SETTINGS['sort-package-json']]) {
    if (['package.json', '__package.json'].includes(basename)) {
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
      ruleId: 'JSON format',
      severity: 2,
      message: `Format Error: ${d.removed ? `unexpected ${valEscaped}` : `expected ${valEscaped} `}`,
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

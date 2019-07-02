const debug = require('debug')('json-settings')
const namespace = 'json'
const _ = require('lodash')
const { stripIndent } = require('common-tags')

const schema = {
  'json-with-comments-filenames': {
    deprecated: true,
    renamed: 'json-with-comments-files',
  },
  'json-with-comments-files': {
    type: 'array',
    default: [
      '**/tsconfig.json',
      '.vscode/**',
    ],
  },
  'sort-package-json': {
    type: 'boolean',
    default: true,
  },
  'ignore-files': {
    type: 'array',
    default: [
      '**/package-lock.json',
    ],
  },
  'package-json-sort-order': {
    type: 'array',
    default: [
      'name',
      'version',
      'private',
      'files',
      'main',
      'browser',
      'scripts',
      'husky',
      'dependencies',
      'devDependencies',
      'peerDependencies',
      'bin',
      'types',
      'typings',
      'description',
      'homepage',
      'license',
      'author',
      'productName',
      'engines',
      'repository',
      'bugs',
    ],
  },
}

function getSetting (settings, name) {
  if (typeof settings[namespace] === 'object' && name in settings[namespace]) {
    return settings[namespace][name]
  }

  return settings[`${namespace}/${name}`]
}

function getSettings (settings) {
  const errors = []
  const warnings = []
  const pluginSettings = _.mapValues(schema, (val, ruleName) => {
    let settingValue = getSetting(settings, ruleName)

    if (settingValue == null) {
      settingValue = val.default
    }

    if (val.deprecated) {
      if (settingValue != null) {
        if (val.renamed) {
          errors.push({
            message: stripIndent`
              Eslint Settings Error: [${namespace}]:
                Using deprecated settings key: "${namespace}/${ruleName}"
                Please rename this settings key to: "${namespace}/${val.renamed}"
              `,
          })
        }
      }

      return
    }

    const type = typeOf(settingValue)

    debug('setting value', { ruleName, settingValue, type })
    if (type !== val.type) {
      throw new Error(stripIndent`
      ESLint Settings Error [${namespace}]: 
        invalid property value ${namespace}/${ruleName}
        expected type of ${val.type}, but got ${type}`)
    }

    { return settingValue }
  })

  debug({ pluginSettings })

  return { pluginSettings, warnings, errors }
}

module.exports = {
  getSettings,
  SETTINGS: _.mapValues(schema, (__, key) => key),
  schema,
}

const typeOf = (obj) => Object.prototype.toString.call(obj).replace(/\[\w+ (\w+)\]/, '$1').toLowerCase()

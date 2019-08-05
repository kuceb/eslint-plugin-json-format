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
    type: ['array', 'boolean'],
    default: 'standard',
    presets: {
      'standard': [],
      'pro': [
        'name',
        'version',
        'description',
        'private',
        'main',
        'browser',
        'scripts',
        'husky',
        'dependencies',
        'devDependencies',
        'peerDependencies',
        'files',
        'bin',
        'engines',
        'types',
        'typings',
        'productName',
        'license',
        'repository',
        'homepage',
        'author',
        'bugs',
      ],
    },
  },
  'ignore-files': {
    type: 'array',
    default: [
      '**/package-lock.json',
    ],
  },
  'package-json-sort-order': {
    type: 'boolean',
    deprecated: true,
    renamed: 'sort-package-json',
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
  const pluginSettings = _.mapValues(schema, (setting, ruleName) => {
    let settingValue = getSetting(settings, ruleName)

    if (settingValue == null) {
      settingValue = setting.default
    } else {
      debug('user supplied setting:', ruleName)
    }

    try {
      settingValue = getFinalSettingValue(settingValue, setting, ruleName)
    } catch (e) {
      errors.push({
        message: e.message,
      })

      return
    }

    return settingValue
  })

  return { pluginSettings, warnings, errors }
}

module.exports = {
  getSettings,
  SETTINGS: _.mapValues(schema, (__, key) => key),
  schema,
  getDefault: (key) => getFinalSettingValue(schema[key].default, schema[key], key),
}

const typeOf = (obj) => {
  return Object.prototype.toString.call(obj).replace(/\[\w+ (\w+)\]/, '$1').toLowerCase()
}

const getFinalSettingValue = (val, setting, ruleName) => {
  const type = typeOf(val)
  const allowedTypes = _.isArray(setting.type) ? setting.type : [setting.type]

  // debug({ ruleName, allowedTypes, type })
  if (setting.deprecated) {
    if (val != null) {
      throwDeprecatedError(setting, ruleName)
    }

    return
  }

  if (setting.presets && type === 'string') {
    if (!setting.presets[val]) {
      throwInvalidTypeError(type, setting, allowedTypes, ruleName)
    }

    return setting.presets[val]
  }

  if (!_.includes(allowedTypes, type)) {
    throwInvalidTypeError(type, setting, allowedTypes, ruleName)
  }

  return val

}

const throwInvalidTypeError = (type, setting, allowedTypes, ruleName) => {
  throw new Error(stripIndent`
      ESLint Settings Error [${namespace}]:
        invalid property value ${namespace}/${ruleName}
        expected type of ${allowedTypes.join(', ')}, but got ${type}
        ${setting.presets ? `
          You may also use one of the following preset values via string:
            ${_.keys(setting.presets).map((v) => `'${v}'`).join(', ')}
          ` : ''}
        `)

}

const throwDeprecatedError = (setting, ruleName) => {
  throw new Error(stripIndent`
    Eslint Settings Error: [${namespace}]:
      Using deprecated settings key: "${namespace}/${ruleName}"
      ${setting.renamed ? `Please rename this settings key to: "${namespace}/${setting.renamed}"` : ''}
  `)
}

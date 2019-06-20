'use strict'

// const oneLine = require('./utils').oneLine

const namespace = 'json'

const defaultJSONCommentsFilenames = [
  'tsconfig.json',
]

function getSetting (settings, name) {
  if (typeof settings[namespace] === 'object' && name in settings[namespace]) {
    return settings[namespace][name]
  }

  return settings[`${namespace}/${name}`]
}

function getSettings (settings) {
  const JSONCommentsFilenames =
    getSetting(settings, 'json-with-comments-filenames') || defaultJSONCommentsFilenames

  let sortPackageJson = getSetting(settings, 'sort-package-json')

  if (sortPackageJson !== false) sortPackageJson = true

  return {
    sortPackageJson,
    JSONCommentsFilenames,
  }
}

module.exports = {
  getSettings,
}

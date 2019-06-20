'use strict'

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

const formatJSON = (obj) => require('@aitodotai/json-stringify-pretty-compact')(obj, { maxNesting: 1 })

const parseJSON = (obj) => require('json5').parse(obj)

const sortPkgJSON = require('sort-package-json')

module.exports = {
  oneLine,
  splatSet,
  formatJSON,
  parseJSON,
  sortPkgJSON,
}

const path = require('path')
const CLIEngine = require('eslint').CLIEngine
// const semver = require('semver')
// const eslintVersion = require('eslint/package.json').version
const { formatJSON, parseJSON, sortPkgJSON } = require('../lib/utils')
const fs = require('fs-extra')
const plugin = require('..')

// function ifVersion (versionSpec, fn, ...args) {
//   const execFn = semver.satisfies(eslintVersion, versionSpec) ? fn : fn.skip

//   execFn(...args)
// }

const getFormatted = async (filename) => {
  return `${formatJSON(parseJSON((await fs.readFile(path.join(__dirname, filename))).toString()))}\n`
}

function execute (file, baseConfig) {
  if (!baseConfig) baseConfig = {}

  const cli = new CLIEngine({
    extensions: ['json'],
    baseConfig: {
      settings: baseConfig.settings,
      rules: Object.assign(
        {
          'no-console': 2,
        },
        baseConfig.rules
      ),
      globals: baseConfig.globals,
      env: baseConfig.env,
      parserOptions: baseConfig.parserOptions,
    },
    ignore: false,
    useEslintrc: false,
    fix: baseConfig.fix,
    reportUnusedDisableDirectives: baseConfig.reportUnusedDisableDirectives,
  })

  cli.addPlugin('json-format', plugin)
  const results = cli.executeOnFiles([path.join(__dirname, file)]).results[0]

  return baseConfig.fix ? results : results && results.messages
}

it('lint bad json', async () => {
  const filename = './fixtures/demo.json'
  const result = execute(filename, {
    fix: true,
  })

  expect(result.output).toBe(await getFormatted(filename))
})

it('lint invalid json', async () => {
  const filename = './fixtures/demo.invalid.json'
  const result = execute(filename, {
    fix: true,
  })

  expect(result).toEqual({
    errorCount: 1,
    filePath: '/home/owner/dev/misc/eslint-plugin-json-format/test/fixtures/demo.invalid.json',
    fixableErrorCount: 0, 'fixableWarningCount': 0,
    messages: [{
      column: '3',
      'fatal': true,
      'line': '3',
      'message': 'invalid character \'\\"\'',
      ruleId: null, 'severity': 2,
    }],
    source: `{
  "foo":1
  "bar": 2
}

`,
    warningCount: 0,
  })

})

it('lint bad json complex', async () => {
  const filename = './fixtures/complex.json'
  const result = execute(filename, {
    fix: true,
  })

  expect(result.output).toBe(await getFormatted(filename))
})

it('lint bad json complex 1', async () => {
  const filename = './fixtures/complex.1.json'
  const result = execute(filename, {
    fix: true,
  })

  // console.log(await getFormatted(filename))
  console.log(result.output)
  expect(result.output).toBe(await getFormatted(filename))
})

it('lint .eslintrc', async () => {
  const filename = './fixtures/.eslintrc'
  const result = execute(filename, {
    fix: true,
  })

  expect(result.output).toBe(await getFormatted(filename))

})

it('lint good json', () => {
  const result = execute('./fixtures/demo.fixed.json', {
    fix: true,
  })

  expect(result).toEqual({
    'errorCount': 0,
    'filePath': '/home/owner/dev/misc/eslint-plugin-json-format/test/fixtures/demo.fixed.json',
    'fixableErrorCount': 0,
    'fixableWarningCount': 0,
    'messages': [],
    'warningCount': 0,
  })
})

it('lint + sort package.json', async () => {
  const filename = './fixtures/__package.json'
  const result = execute(filename, {
    fix: true,
  })

  // console.log(result.output)

  expect(result.output).toBe(`${formatJSON(sortPkgJSON(parseJSON(await getFormatted(filename))))}\n`)

})

describe('configuration', () => {

  it('not sort package.json when config', async () => {
    const filename = './fixtures/__package.json'
    const result = execute(filename, {
      fix: true,
      'settings': {
        'json/sort-package-json': false,
      },
    })

    expect(result.output).toBe(await getFormatted(filename))

  })

  it('leaves json-with-comments-filenames alone', async () => {
    const filename = './fixtures/demo.json'
    const result = execute(filename, {
      fix: true,
      settings: { 'json/json-with-comments-filenames': ['demo.json'] },
    })

    expect(result.output).toBe(undefined)
  })
})

it('lint bad js', () => {
  const res = execute('./fixtures/jsdemo.js', {
    rules: {
      'no-multiple-empty-lines': 'error',
      'quotes': ['error', 'single'],

    },
    fix: true,
  })

  expect(res.output).toEqual(`'foo'


// const one = 'foo'
`)
})

it('lint invalid js', () => {
  const res = execute('./fixtures/jsdemo.invalid.js', {
    rules: {
      'no-multiple-empty-lines': 'error',
      'quotes': ['error', 'single'],

    },
    fix: true,
  })

  expect(res).toEqual({
    'errorCount': 1,
    'filePath': '/home/owner/dev/misc/eslint-plugin-json-format/test/fixtures/jsdemo.invalid.js',
    'fixableErrorCount': 0,
    'fixableWarningCount': 0,
    'messages': [
      {
        'column': 1,
        'fatal': true,
        'line': 1,
        'message': 'Parsing error: Unexpected token >>',
        'ruleId': null,
        'severity': 2,
      },
    ],
    'source': '>>\n',
    'warningCount': 0,
  }

  )
})

it('lint good js', () => {
  const res = execute('./fixtures/jsdemo.fixed.js', {
    rules: {
      'no-multiple-empty-lines': 'error',
      'quotes': ['error', 'single'],

    },
    fix: true,
  })

  expect(res).toEqual({
    'errorCount': 0,
    'filePath': '/home/owner/dev/misc/eslint-plugin-json-format/test/fixtures/jsdemo.fixed.js',
    'fixableErrorCount': 0,
    'fixableWarningCount': 0,
    'messages': [],
    'warningCount': 0,
  })

})

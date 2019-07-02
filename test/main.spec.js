const _ = require('lodash')
const CLIEngine = require('eslint').CLIEngine
const fs = require('fs-extra')
const path = require('path')
const settings = require('../lib/settings')
const { formatJSON, parseJSON, sortPkgJSON } = require('../lib/utils')
const { stripIndent } = require('common-tags')
let plugin = require('..')

const defaultSettings = _.mapValues(settings.schema, (v) => v.default)

const getFormatted = async (filename) => {
  return formatJSON(
    parseJSON((await fs.readFile(path.join(__dirname, filename))).toString())
  )
}

const getFormattedAndSorted = async (filename) => {
  return formatJSON(sortPkgJSON(parseJSON(await getFormatted(filename)), defaultSettings['package-json-sort-order']))
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

  return results
}

describe('main spec', () => {
  beforeEach(() => {
    process.cwd = jest.fn().mockReturnValue(path.join(__dirname, 'fixtures'))
  })

  it('lint bad json', async () => {
    const filename = './fixtures/demo.json'
    const result = execute(filename, {
      fix: true,
    })

    expect(result.output).toBe(await getFormatted(filename))
    expect(result.messages).toHaveLength(0)
  })

  it('lint bad json no fix', async () => {
    const filename = './fixtures/demo.json'
    const result = execute(filename, {})

    expect(result.messages[0]).toHaveProperty('severity', 2)
    expect(result.messages[0]).toHaveProperty(
      'message',
      'Format Error: expected "\\n" '
    )
  })

  it('lint invalid json', async () => {
    const filename = './fixtures/demo.invalid.json'
    const result = execute(filename, {
      fix: true,
    })

    expect(result).toMatchObject({
      filePath: path.join(__dirname, filename),
      errorCount: 1,
      fixableErrorCount: 0,
      fixableWarningCount: 0,
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

  it('lint bad json missing commas', async () => {
    const filename = './fixtures/demo.missing-commas.json'
    const result = execute(filename, {
      fix: true,
    })

    expect(result.output).toBe(`${stripIndent`
    {
      "foo": 1,
      "bar": "two",
      "baz": "three"
    }`}\n`)
  })

  it('lint bad json complex 1', async () => {
    const filename = './fixtures/complex.1.json'
    const result = execute(filename, {
      fix: true,
    })

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
    const filename = './fixtures/demo.fixed.json'
    const result = execute(filename, {
      fix: true,
    })

    expect(result).toEqual({
      filePath: path.join(__dirname, filename),
      errorCount: 0,
      fixableErrorCount: 0,
      fixableWarningCount: 0,
      messages: [],
      warningCount: 0,
    })
  })

  it('lint + sort package.json', async () => {
    const filename = './fixtures/__package.json'
    const result = execute(filename, {
      fix: true,
    })

    expect(result.output).toBe(await getFormattedAndSorted(filename))
  })

  it('lint + sort big package.json', async () => {
    const filename = './fixtures/big/__package.json'
    const result = execute(filename, {
      fix: true,
    })

    // console.log(result.output)

    expect(result.output).toBe(await getFormattedAndSorted(filename))
  })

  it('lint + sort package.json in correct order', async () => {
    const filename = './fixtures/__package.json'
    const result = execute(filename, {
      fix: true,
    })

    // starts out of order
    expectOrder(_.keys(JSON.parse(await getFormatted(filename))), [
      'license',
      'dependencies',
    ])

    expect(result.output).toBe(await getFormattedAndSorted(filename))
    const resultOrder = _.keys(JSON.parse(result.output))

    // ends up in order
    expectOrder(resultOrder, ['dependencies', 'license'])
  })

  describe('configuration', () => {
    it('not sort package.json when config', async () => {
      const filename = './fixtures/__package.json'
      const result = execute(filename, {
        fix: true,
        settings: {
          'json/sort-package-json': false,
        },
      })

      expect(result.output).toBe(await getFormatted(filename))
    })

    it('ignores json-with-comments-files (for now)', async () => {
      let filename = './fixtures/demo.json'
      let result = execute(filename, {
        fix: true,
        settings: { 'json/json-with-comments-files': ['demo.json'] },
      })

      expect(result.warningCount).toBe(1)
      expect(result.messages[0].message).toContain('json-with-comments-files')

      filename = './fixtures/.vscode/settings.json'
      result = execute(filename, {
        fix: true,
      })

      expect(result.warningCount).toBe(1)
      expect(result.messages[0].message).toContain('json-with-comments-files')
      expect(result.messages[0].message).toMatchSnapshot()
    })

    it('ignores ignore-files', () => {
      const filename = './fixtures/ignore-this-file.json'
      const result = execute(filename, {
        fix: true,
        settings: { 'json/ignore-files': ['ignore-this-file.json'] },
      })

      expect(result.warningCount).toBe(1)
      expect(result.messages[0].message).toContain('ignore-files')
    })

    it('ignores package-lock.json by default', () => {
      const filename = './fixtures/package-lock.json'
      const result = execute(filename)

      expect(result.warningCount).toBe(1)
      expect(result.messages[0].message).toContain('ignore-files')
    })

    it('allows pathnames for filenames settings', () => {
      const filename = './fixtures/ignore-this-file.json'
      const result = execute(filename, {
        fix: true,
        settings: { 'json/ignore-files': ['ignore-this-file.json'] },
      })

      expect(result.warningCount).toBe(1)
      expect(result.messages[0].message).toContain('ignore-files')
    })

    it('allows pathnames for filenames settings in win32', () => {
      const filename = './fixtures/ignore-this-file.json'

      const result = execute(filename, {
        fix: true,
        settings: { 'json/ignore-files': ['ignore-this-file.json'] },
      })

      expect(result.warningCount).toBe(1)
      expect(result.messages[0].message).toContain('ignore-files')
    })

    it('package.json sort order', async () => {
      const filename = './fixtures/sort-order/__package.json'
      const result = execute(filename, {
        fix: true,
        settings: { 'json/package-json-sort-order': ['foo', 'bar'] },
      })

      expectOrder(_.keys(parseJSON(result.output)), ['foo', 'bar'])
    })
  })

  it('lint bad js', () => {
    const res = execute('./fixtures/jsdemo.js', {
      rules: {
        'no-multiple-empty-lines': 'error',
        quotes: ['error', 'single'],
      },
      fix: true,
    })

    expect(res.output).toEqual(`'foo'


// const one = 'foo'
`)

    expect(res.messages).toHaveLength(0)
  })

  it('lint bad js no fix', () => {
    const res = execute('./fixtures/jsdemo.js', {
      rules: {
        'no-multiple-empty-lines': 'error',
        quotes: ['error', 'single'],
      },
    })

    expect(res.messages[0]).toHaveProperty('severity', 2)
  })

  it('lint invalid js', () => {
    const filename = './fixtures/jsdemo.invalid.js'
    const res = execute(filename, {
      rules: {
        'no-multiple-empty-lines': 'error',
        quotes: ['error', 'single'],
      },
      fix: true,
    })

    expect(res).toEqual({
      filePath: path.join(__dirname, filename),
      errorCount: 1,
      fixableErrorCount: 0,
      fixableWarningCount: 0,
      messages: [
        {
          column: 1,
          fatal: true,
          line: 1,
          message: 'Parsing error: Unexpected token >>',
          ruleId: null,
          severity: 2,
        },
      ],
      source: '>>\n',
      warningCount: 0,
    })
  })

  it('lint good js', () => {
    const filename = './fixtures/jsdemo.fixed.js'
    const res = execute(filename, {
      rules: {
        'no-multiple-empty-lines': 'error',
        quotes: ['error', 'single'],
      },
      fix: true,
    })

    expect(res).toEqual({
      filePath: path.join(__dirname, filename),
      errorCount: 0,
      fixableErrorCount: 0,
      fixableWarningCount: 0,
      messages: [],
      warningCount: 0,
    })
  })

  describe('errors', () => {
    it('handles errors with good error message', () => {
      jest.mock('eslint/lib/linter', () => false)
      jest.resetModules()

      let err

      try {
        require('..')
      } catch (e) {
        err = e
      }

      expect(err).toBeTruthy()
      expect(err.message).toContain('ESLint version:')
    })

    describe('bad settings', () => {
      it('json-with-comments-filenames', async () => {
        const filename = './fixtures/demo.json'
        const result = execute(filename, {
          fix: true,
          settings: { 'json/json-with-comments-filenames': ['demo.json'] },
        })

        expect(result.warningCount).toBe(1)
        expect(result.messages[0].message).toMatchSnapshot()
      })
    })
  })

  const expectOrder = (arr, order) => {
    expect(_.intersection(arr, order)).toEqual(order)
  }

})

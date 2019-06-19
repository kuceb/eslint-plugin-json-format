const path = require('path')
const CLIEngine = require('eslint').CLIEngine
// const semver = require('semver')
// const eslintVersion = require('eslint/package.json').version
const plugin = require('..')

// function ifVersion (versionSpec, fn, ...args) {
//   const execFn = semver.satisfies(eslintVersion, versionSpec) ? fn : fn.skip

//   execFn(...args)
// }

function execute (file, baseConfig) {
  if (!baseConfig) baseConfig = {}

  const cli = new CLIEngine({
    extensions: ['html'],
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
  const results = cli.executeOnFiles([path.join(__dirname, file)])
  .results[0]

  return baseConfig.fix ? results : results && results.messages
}

it('should extract and remap messages', () => {
  const messages = execute('./fixtures/demo.json')

  execute(messages).ok
  expect(messages.length).toBe(5)

})

// it("should report correct line numbers with crlf newlines", () => {
//   const messages = execute("crlf-newlines.html")

//   expect(messages.length).toBe(1)

//   expect(messages[0].message).toBe("Unexpected console statement.")
//   expect(messages[0].line).toBe(8)
//   expect(messages[0].column).toBe(7)
// })

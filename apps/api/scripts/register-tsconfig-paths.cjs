const path = require('path')
const tsConfigPaths = require('tsconfig-paths')

const projectRoot = path.resolve(__dirname, '..')
const tsconfigPath = path.join(projectRoot, 'tsconfig.json')

const configResult = tsConfigPaths.loadConfig(tsconfigPath)
if (configResult.resultType === 'failed') {
  throw new Error(`[register-tsconfig-paths] ${configResult.message}`)
}

tsConfigPaths.register({
  baseUrl: configResult.absoluteBaseUrl,
  paths: configResult.paths,
})


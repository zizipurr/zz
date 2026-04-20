const path = require('path')
const Module = require('module')

// TypeORM CLI (and some dynamic loaders) can bypass tsconfig-paths in practice.
// This hook makes imports like "@/foo/bar" work reliably in CJS by mapping them
// to "<projectRoot>/src/foo/bar".
const projectRoot = path.resolve(__dirname, '..')
const srcRoot = path.join(projectRoot, 'src')

const originalResolveFilename = Module._resolveFilename

Module._resolveFilename = function (request, parent, isMain, options) {
  if (typeof request === 'string' && request.startsWith('@/')) {
    const mapped = path.join(srcRoot, request.slice(2))
    return originalResolveFilename.call(this, mapped, parent, isMain, options)
  }
  return originalResolveFilename.call(this, request, parent, isMain, options)
}


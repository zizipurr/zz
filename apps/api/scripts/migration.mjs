#!/usr/bin/env node
import { spawnSync } from 'child_process'

const args = process.argv.slice(2)
if (args.length === 0) {
  console.error('用法: node scripts/migration.mjs <run|revert|show|generate|create> [args...]')
  process.exit(1)
}

const [cmd, ...rest] = args
const typeormCli = './node_modules/typeorm/cli.js'
const dataSource = 'src/db/data-source.ts'

const needsDataSource = ['run', 'revert', 'show', 'generate'].includes(cmd)

// generate/create 没传路径时，用默认路径
const defaultPath = 'src/db/migrations/Migration'
const finalRest = (cmd === 'generate' || cmd === 'create') && rest.length === 0
  ? [defaultPath]
  : rest

const nodeArgs = [
  '-r', 'ts-node/register',
  '-r', 'tsconfig-paths/register',
  typeormCli,
  `migration:${cmd}`,
  ...finalRest,
  ...(needsDataSource ? ['-d', dataSource] : []),
]

const result = spawnSync('node', nodeArgs, {
  stdio: 'inherit',
  shell: false,
})

process.exit(result.status ?? 0)
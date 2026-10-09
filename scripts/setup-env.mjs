#!/usr/bin/env node
// Writes apps/web/.env.local from `.env.example` + the running local Supabase stack.
// Usage: pnpm env:setup [--force]
import { execSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const target = `${root}apps/web/.env.local`
const force = process.argv.includes('--force')

if (existsSync(target) && !force) {
  console.log('apps/web/.env.local already exists. Re-run with --force to overwrite it.')
  process.exit(0)
}

let status
try {
  const raw = execSync('supabase status -o json', {
    cwd: root,
    stdio: ['ignore', 'pipe', 'ignore'],
  })
  status = JSON.parse(raw.toString().replace(/^[^{]*/, ''))
} catch {
  console.error('Local Supabase is not running. Start it first with `pnpm db:start`.')
  process.exit(1)
}

const values = {
  NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: status.PUBLISHABLE_KEY,
  SUPABASE_SECRET_KEY: status.SECRET_KEY,
}

const output = readFileSync(`${root}.env.example`, 'utf8')
  .split(/\r?\n/)
  .map((line) => {
    const key = line.split('=')[0]
    return key in values ? `${key}=${values[key]}` : line
  })
  .join('\n')

writeFileSync(target, output)
console.log('Wrote apps/web/.env.local with your local Supabase keys.')

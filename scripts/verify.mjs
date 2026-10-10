// `pnpm verify`: everything that must pass before code ships, in the order that fails fastest.
// Integration tests need the local Supabase stack (`pnpm db:start`). VERBOSE=1 streams output.
import { execSync } from 'node:child_process'
import { closeSync, mkdtempSync, openSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { repoRoot } from './lib/env-file.mjs'

const STEPS = [
  // Same check Vercel and CI run (frozen lockfile): a package.json change without the lockfile.
  ['lockfile', 'pnpm install --frozen-lockfile --lockfile-only --ignore-scripts'],
  ['format', 'pnpm format:check'],
  ['lint', 'pnpm lint'],
  ['typecheck', 'pnpm typecheck'],
  ['unit tests', 'pnpm test'],
  ['integration tests', 'pnpm test:integration'],
]

const stackUp = await fetch('http://127.0.0.1:54321/rest/v1/', { method: 'HEAD' }).then(
  () => true,
  () => false,
)
if (!stackUp) {
  console.error('Local Supabase is not running: start it with `pnpm db:start`.')
  process.exit(1)
}

// Output goes to a file, not a pipe: background helpers (turbo, esbuild) can outlive a step and
// keep a pipe open, which would make execSync wait forever.
const logDir = mkdtempSync(join(tmpdir(), 'verify-'))
const started = Date.now()
for (const [name, command] of STEPS) {
  const t = Date.now()
  const logFile = join(logDir, `${name.replace(/\W+/g, '-')}.log`)
  const fd = openSync(logFile, 'w')
  try {
    execSync(command, {
      cwd: repoRoot,
      stdio: process.env.VERBOSE ? 'inherit' : ['ignore', fd, fd],
    })
    console.log(`✓ ${name} (${String(Math.round((Date.now() - t) / 1000))}s)`)
  } catch {
    console.error(`✗ ${name} failed: \`${command}\` (full log: ${logFile})`)
    console.error(readFileSync(logFile, 'utf8').split('\n').slice(-60).join('\n'))
    process.exit(1)
  } finally {
    closeSync(fd)
  }
}
console.log(`All checks passed in ${String(Math.round((Date.now() - started) / 1000))}s.`)

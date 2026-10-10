// `pnpm ship`: the one command that releases `main` to production, in the only safe order:
//   1. clean tree on `main`, up to date with origin
//   2. `pnpm verify` (format, lint, types, unit + integration tests)
//   3. pending migrations → production (`pnpm db:push`), BEFORE the code that needs them
//   4. `git push origin main` → Vercel deploys automatically
// After the deploy finishes, check `pnpm health`.
import { execSync } from 'node:child_process'
import { repoRoot } from './lib/env-file.mjs'

const run = (command, opts = {}) =>
  execSync(command, { cwd: repoRoot, encoding: 'utf8', stdio: 'pipe', ...opts })
const step = (message) => {
  console.log(`\n▶ ${message}`)
}
const fail = (message) => {
  console.error(`✗ ${message}`)
  process.exit(1)
}

step('Checking git state')
if (run('git rev-parse --abbrev-ref HEAD').trim() !== 'main') fail('Not on main.')
if (run('git status --porcelain').trim()) fail('Uncommitted changes: commit or stash first.')
run('git fetch origin main')
const behind = Number(run('git rev-list --count HEAD..origin/main').trim())
if (behind > 0) fail(`main is ${String(behind)} commit(s) behind origin/main: pull first.`)
const ahead = Number(run('git rev-list --count origin/main..HEAD').trim())
if (ahead === 0) fail('Nothing to ship: main is already on origin.')
console.log(`${String(ahead)} commit(s) to ship.`)

step('Verifying')
run('node scripts/verify.mjs', { stdio: 'inherit' })

step('Migrations')
const dryRun = run('node scripts/with-supabase-token.mjs db push --dry-run')
if (/Would push these migrations/.test(dryRun)) {
  console.log(
    dryRun
      .split('\n')
      .filter((l) => l.includes('•'))
      .join('\n'),
  )
  run('node scripts/with-supabase-token.mjs db push --yes', { stdio: 'inherit' })
} else {
  console.log('Production schema is up to date.')
}

step('Pushing main (Vercel deploys on push)')
run('git push origin main', { stdio: 'inherit' })
console.log('\nShipped. When the deploy is live, run `pnpm health`.')

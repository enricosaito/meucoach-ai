// Runs a Supabase CLI command with this repo's access token, so production commands (db push,
// migration list) don't depend on whichever account `supabase login` last used on this machine.
//
// The token lives in `.env.supabase.local` (git-ignored by `.env.*.local`):
//   SUPABASE_ACCESS_TOKEN=sbp_...
// Create it at https://supabase.com/dashboard/account/tokens while signed in as the project owner.
//
// Usage: node scripts/with-supabase-token.mjs db push --dry-run
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const file = join(root, '.env.supabase.local')

if (!existsSync(file)) {
  console.error(
    'Missing .env.supabase.local with SUPABASE_ACCESS_TOKEN=... (see scripts/with-supabase-token.mjs).',
  )
  process.exit(1)
}

const env = { ...process.env }
for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
  const match = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line)
  if (match?.[1] && !line.trimStart().startsWith('#')) {
    env[match[1]] = match[2]?.replace(/^(['"])(.*)\1$/, '$2') ?? ''
  }
}
if (!env.SUPABASE_ACCESS_TOKEN) {
  console.error('.env.supabase.local has no SUPABASE_ACCESS_TOKEN.')
  process.exit(1)
}

const result = spawnSync('supabase', process.argv.slice(2), {
  cwd: root,
  env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
})
process.exit(result.status ?? 1)

// Runs a Supabase CLI command with this repo's access token, so production commands (db push,
// migration list) don't depend on whichever account `supabase login` last used on this machine.
//
// The token lives in the git-ignored `.env.local` (or `.env.supabase.local`):
//   SUPABASE_ACCESS_TOKEN=sbp_...
// Create it at https://supabase.com/dashboard/account/tokens while signed in as the project owner.
//
// Usage: node scripts/with-supabase-token.mjs db push --dry-run
import { spawnSync } from 'node:child_process'
import { loadEnvFile, repoRoot } from './lib/env-file.mjs'

const vars = loadEnvFile(
  ['.env.local', '.env.supabase.local'],
  'SUPABASE_ACCESS_TOKEN',
  'Add SUPABASE_ACCESS_TOKEN=... (see scripts/with-supabase-token.mjs).',
)

const result = spawnSync('supabase', process.argv.slice(2), {
  cwd: repoRoot,
  env: { ...process.env, ...vars },
  stdio: 'inherit',
  shell: process.platform === 'win32',
})
process.exit(result.status ?? 1)

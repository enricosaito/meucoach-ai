// `pnpm mobile`: starts the Expo dev server for apps/mobile, signed in to Expo as the project
// owner via EXPO_TOKEN from the git-ignored root `.env.local` (Expo Go refuses projects whose
// owner the CLI isn't signed in as). Extra arguments are passed on, e.g. `pnpm mobile --tunnel`.
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { loadEnvFile, repoRoot } from './lib/env-file.mjs'

const vars = loadEnvFile(
  ['.env.local', '.env.expo.local'],
  'EXPO_TOKEN',
  'Add EXPO_TOKEN=... (see scripts/eas.mjs).',
)

const result = spawnSync('pnpm', ['exec', 'expo', 'start', ...process.argv.slice(2)], {
  cwd: join(repoRoot, 'apps', 'mobile'),
  env: { ...process.env, ...vars },
  stdio: 'inherit',
  shell: process.platform === 'win32',
})
process.exit(result.status ?? 1)

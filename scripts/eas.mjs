// Runs the EAS CLI for apps/mobile with this repo's Expo token, so builds and project commands
// don't depend on `eas login` on this machine.
//
// The token lives in the git-ignored root `.env.local`:
//   EXPO_TOKEN=...
// Create it at expo.dev → Account settings → Access tokens (account: enricolass).
//
// Usage: pnpm eas whoami | pnpm eas build --profile development --platform ios
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { loadEnvFile, repoRoot } from './lib/env-file.mjs'

const vars = loadEnvFile(
  ['.env.local', '.env.expo.local'],
  'EXPO_TOKEN',
  'Add EXPO_TOKEN=... (see scripts/eas.mjs).',
)

const result = spawnSync('npx', ['--yes', 'eas-cli@latest', ...process.argv.slice(2)], {
  cwd: join(repoRoot, 'apps', 'mobile'),
  env: { ...process.env, ...vars },
  stdio: 'inherit',
  shell: process.platform === 'win32',
})
process.exit(result.status ?? 1)

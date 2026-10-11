import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

/**
 * Points the integration tests at the local Supabase stack. Values come from the environment if
 * set, otherwise from `supabase status` (requires `pnpm db:start`).
 */
if (!process.env.SUPABASE_SECRET_KEY) {
  const repoRoot = fileURLToPath(new URL('../../..', import.meta.url))
  let status: Record<string, string>
  try {
    status = JSON.parse(
      execSync('supabase status -o json', { cwd: repoRoot, stdio: ['ignore', 'pipe', 'ignore'] })
        .toString()
        .replace(/^[^{]*/, ''),
    ) as Record<string, string>
  } catch (error) {
    throw new Error('Local Supabase is not running. Start it with `pnpm db:start`.', {
      cause: error,
    })
  }
  process.env.NEXT_PUBLIC_SUPABASE_URL = status.API_URL
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = status.PUBLISHABLE_KEY
  process.env.SUPABASE_SECRET_KEY = status.SECRET_KEY
}
process.env.AI_PROVIDER = 'mock'
process.env.AI_MOCK_DELAY_MS = '0'
process.env.LOG_LEVEL = process.env.DEBUG_LOGS ? 'error' : 'silent'

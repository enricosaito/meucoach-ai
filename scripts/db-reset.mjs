// `pnpm db:reset`: re-applies all migrations + seed.sql to the LOCAL stack, then restarts the
// storage API and waits for it. After a reset the storage container can keep a stale view of the
// storage schema and fail uploads with Postgres 42P10; a restart fixes it.
import { execSync } from 'node:child_process'

const STORAGE_CONTAINER = 'supabase_storage_meucoach-ai' // from project_id in supabase/config.toml
const STORAGE_STATUS = 'http://127.0.0.1:54321/storage/v1/status'

execSync('supabase db reset', { stdio: 'inherit' })
execSync(`docker restart ${STORAGE_CONTAINER}`, { stdio: 'ignore' })

for (let attempt = 0; attempt < 30; attempt++) {
  const ok = await fetch(STORAGE_STATUS).then(
    (res) => res.ok,
    () => false,
  )
  if (ok) {
    console.log('Storage API ready. Demo user: demo@example.test (see supabase/seed.sql).')
    process.exit(0)
  }
  await new Promise((resolve) => setTimeout(resolve, 1000))
}
console.error(`Storage API did not come back at ${STORAGE_STATUS}`)
process.exit(1)

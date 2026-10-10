// Shows recent PRODUCTION Inngest activity: the last events of each kind and the runs they
// started (status, function, timing), plus the job-health verdict from the app.
//
// Needs the production signing key in the git-ignored `.env.local` (or `.env.inngest.local`):
//   INNGEST_SIGNING_KEY=signkey-prod-...
// Inngest dashboard → your app's Production environment → Manage → Signing Key.
//
// Usage: pnpm inngest:status [limit]
import { loadEnvFile } from './lib/env-file.mjs'

const { INNGEST_SIGNING_KEY } = loadEnvFile(
  ['.env.local', '.env.inngest.local'],
  'INNGEST_SIGNING_KEY',
  'Add INNGEST_SIGNING_KEY=signkey-prod-... (see scripts/inngest-status.mjs).',
)
const API = 'https://api.inngest.com/v1'
const EVENTS = [
  'training/plan.requested',
  'nutrition/diet-plan.requested',
  'outbox/dispatch.requested',
]
const limit = Number(process.argv[2]) || 5
// Without received_after the API only searches a short recent window.
const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()

async function get(path) {
  const res = await fetch(`${API}${path}`, {
    headers: { authorization: `Bearer ${INNGEST_SIGNING_KEY}` },
  })
  if (!res.ok) throw new Error(`${path}: HTTP ${String(res.status)} ${await res.text()}`)
  return (await res.json()).data ?? []
}

const ago = (iso) => {
  if (!iso) return '—'
  const s = Math.round((Date.now() - Date.parse(iso)) / 1000)
  return s < 120
    ? `${String(s)}s ago`
    : s < 7200
      ? `${String(Math.round(s / 60))}m ago`
      : `${String(Math.round(s / 3600))}h ago`
}

let failures = 0
for (const name of EVENTS) {
  console.log(`\n# ${name}`)
  let events
  try {
    events = await get(
      `/events?name=${encodeURIComponent(name)}&limit=${String(limit)}&received_after=${since}`,
    )
  } catch (error) {
    console.log(`  could not list events: ${error.message}`)
    failures++
    continue
  }
  if (events.length === 0) console.log('  (no recent events)')
  for (const event of events) {
    const id = event.internal_id ?? event.id
    let runs = []
    try {
      runs = await get(`/events/${encodeURIComponent(id)}/runs`)
    } catch (error) {
      console.log(`  ${ago(event.received_at)}  runs unavailable: ${error.message}`)
      continue
    }
    const summary = runs.length
      ? runs.map((r) => `${r.status}${r.ended_at ? '' : ' (running)'}`).join(', ')
      : 'NO RUNS (function not triggered: app synced? function paused?)'
    console.log(`  ${ago(event.received_at)}  ${summary}`)
  }
}

const health = await fetch('https://meucoach-ai.vercel.app/api/v1/health/jobs')
  .then((r) => (r.ok || r.status === 503 ? r.json() : null))
  .catch(() => null)
console.log('\n# app job health')
console.log(
  health
    ? `  ${health.status} ${health.problems?.join('; ') ?? ''}`
    : '  unavailable (not deployed yet?)',
)
process.exit(failures ? 1 : 0)

// Prints the health of the background job pipeline. Production by default:
//   pnpm health            → https://meucoach-ai.vercel.app
//   pnpm health --local    → http://localhost:3000
// Exits non-zero when the pipeline is degraded, so it can gate scripts.
const base = process.argv.includes('--local')
  ? 'http://localhost:3000'
  : 'https://meucoach-ai.vercel.app'

const res = await fetch(`${base}/api/v1/health/jobs`).catch((error) => {
  console.error(`Could not reach ${base}: ${error.message}`)
  process.exit(2)
})
const body = await res.json().catch(() => null)
console.log(`${base} → HTTP ${res.status}`)
console.log(JSON.stringify(body, null, 2))
process.exit(res.ok ? 0 : 1)

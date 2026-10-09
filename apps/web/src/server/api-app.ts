import 'server-only'
import { createApp, createDefaultDeps, parseApiEnv, type App } from '@mycoach/api'

let app: App | undefined

/** Lazily builds the Hono app once per server process. Env is validated on first request. */
export function getApiApp(): App {
  app ??= createApp(createDefaultDeps(parseApiEnv(process.env)))
  return app
}

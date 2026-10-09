import { defineConfig } from 'vitest/config'

// Runs against the local Supabase stack (`pnpm db:start`).
export default defineConfig({
  test: {
    include: ['test/**/*.integration.test.ts'],
    setupFiles: ['test/setup-env.ts'],
    testTimeout: 20_000,
    hookTimeout: 30_000,
    fileParallelism: false,
  },
})

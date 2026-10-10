import { Inngest } from 'inngest'

/**
 * Inngest client. Local dev: set INNGEST_DEV=1 and run the Inngest Dev Server (`pnpm dev` does).
 * Production: INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY (Vercel Marketplace integration).
 */
export const inngest = new Inngest({
  id: 'mycoach',
  // Keep each invocation well under the Vercel function limit (300 s); long steps resume.
  checkpointing: { maxRuntime: '240s' },
})

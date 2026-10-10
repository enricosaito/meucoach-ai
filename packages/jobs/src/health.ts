import type { AdminClient } from '@mycoach/db'
import { z } from 'zod'

/** The outbox should be drained within a minute (cron) or seconds (nudge). */
export const MAX_OUTBOX_AGE_SECONDS = 5 * 60

const jobHealthRowSchema = z.object({
  pendingOutbox: z.number(),
  oldestPendingOutboxSeconds: z.number(),
  lastDispatchedAt: z.string().nullable(),
  stuckWorkoutPlans: z.number(),
  stuckDietPlans: z.number(),
})

export type JobHealth = z.infer<typeof jobHealthRowSchema> & {
  status: 'ok' | 'degraded'
  problems: string[]
}

/** Pure: turns the raw numbers into a verdict a monitor can alert on. */
export function assessJobHealth(row: z.infer<typeof jobHealthRowSchema>): JobHealth {
  const problems: string[] = []
  if (row.oldestPendingOutboxSeconds > MAX_OUTBOX_AGE_SECONDS) {
    problems.push(
      `outbox not dispatched for ${String(row.oldestPendingOutboxSeconds)}s (${String(row.pendingOutbox)} events): is Inngest calling /api/inngest?`,
    )
  }
  if (row.stuckWorkoutPlans > 0) {
    problems.push(`${String(row.stuckWorkoutPlans)} workout plan(s) unfinished after 15 min`)
  }
  if (row.stuckDietPlans > 0) {
    problems.push(`${String(row.stuckDietPlans)} diet plan(s) unfinished after 15 min`)
  }
  return { ...row, status: problems.length ? 'degraded' : 'ok', problems }
}

/** Health of the background pipeline. Platform concern, so the jobs package owns this query. */
export async function getJobHealth(db: AdminClient): Promise<JobHealth> {
  const { data, error } = await db.rpc('ops_job_health', {})
  if (error) throw new Error(`job health query failed: ${error.message}`)
  return assessJobHealth(jobHealthRowSchema.parse(data))
}

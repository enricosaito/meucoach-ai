import { eventType } from 'inngest'
import { z } from 'zod'

// Event names match `outbox_events.type`; payloads match what the SQL functions write.

export const planRequestedSchema = z.object({
  planId: z.uuid(),
  userId: z.uuid(),
  bodyScanId: z.uuid().nullable(),
  requestId: z.string(),
})

export const planRequested = eventType('training/plan.requested', { schema: planRequestedSchema })

export const dietPlanRequestedSchema = z.object({
  planId: z.uuid(),
  userId: z.uuid(),
  requestId: z.string(),
})

export const dietPlanRequested = eventType('nutrition/diet-plan.requested', {
  schema: dietPlanRequestedSchema,
})

/** Sent by the API after a write that added outbox rows, so dispatch doesn't wait for the cron. */
export const outboxDispatchRequested = eventType('outbox/dispatch.requested', {
  schema: z.object({}),
})

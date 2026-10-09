import { dbError, type AdminClient } from '../../../shared'
import type { AiCallRecorder } from '../ai/gateway'

export function createAiCallRecorder(db: AdminClient): AiCallRecorder {
  return async (record) => {
    const { data, error } = await db
      .from('ai_calls')
      .insert({
        user_id: record.userId,
        feature: record.feature,
        provider: record.provider,
        model: record.model,
        prompt_version: record.promptVersion,
        input_tokens: record.inputTokens,
        output_tokens: record.outputTokens,
        cost_usd: record.costUsd,
        latency_ms: record.latencyMs,
        status: record.status,
        error: record.error,
        request_id: record.requestId,
      })
      .select('id')
      .single()
    if (error) throw dbError('recordAiCall', error)
    return data
  }
}

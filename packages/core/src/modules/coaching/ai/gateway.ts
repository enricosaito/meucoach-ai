import { AppError, noopLogger, type Logger } from '../../../shared'
import { estimateCostUsd } from './pricing'
import type { AiProvider, ProviderChatRequest, ProviderChatResult } from './types'

export interface AiCallRecord {
  userId: string
  feature: string
  provider: string
  model: string
  promptVersion: string
  inputTokens: number
  outputTokens: number
  costUsd: number
  latencyMs: number
  status: 'succeeded' | 'failed'
  error: string | null
  requestId: string | null
}

/** Persists one row per AI call. Implemented by the coaching data layer. */
export type AiCallRecorder = (record: AiCallRecord) => Promise<{ id: string }>

export interface GatewayChatInput {
  userId: string
  feature: string
  promptVersion: string
  requestId?: string | undefined
  request: ProviderChatRequest
}

export interface GatewayChatResult extends ProviderChatResult {
  aiCallId: string
}

/**
 * The single entry point for every AI call: picks the configured provider, measures latency,
 * estimates cost and records the call in `ai_calls` whether it succeeds or fails.
 */
export function createAiGateway(deps: {
  provider: AiProvider
  recordCall: AiCallRecorder
  logger?: Logger
  now?: () => number
}) {
  const { provider, recordCall } = deps
  const logger = deps.logger ?? noopLogger
  const now = deps.now ?? (() => performance.now())

  return {
    providerName: provider.name,

    async chat(input: GatewayChatInput): Promise<GatewayChatResult> {
      const started = now()
      const base = {
        userId: input.userId,
        feature: input.feature,
        provider: provider.name,
        promptVersion: input.promptVersion,
        requestId: input.requestId ?? null,
      }

      let result: ProviderChatResult
      try {
        result = await provider.chat(input.request)
      } catch (error) {
        const latencyMs = Math.round(now() - started)
        const message = error instanceof Error ? error.message : String(error)
        logger.error({ err: error, feature: input.feature, latencyMs }, 'ai call failed')
        await recordCall({
          ...base,
          model: 'unknown',
          inputTokens: 0,
          outputTokens: 0,
          costUsd: 0,
          latencyMs,
          status: 'failed',
          error: message.slice(0, 1000),
        }).catch((recordError: unknown) => {
          logger.error({ err: recordError }, 'failed to record ai call')
        })
        throw new AppError('ai_unavailable', 'The coach is unavailable right now. Try again.', {
          cause: error,
        })
      }

      const latencyMs = Math.round(now() - started)
      const costUsd = estimateCostUsd(result.model, result.inputTokens, result.outputTokens)
      const { id } = await recordCall({
        ...base,
        model: result.model,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        costUsd,
        latencyMs,
        status: 'succeeded',
        error: null,
      })
      logger.info(
        { feature: input.feature, model: result.model, latencyMs, costUsd, aiCallId: id },
        'ai call succeeded',
      )
      return { ...result, aiCallId: id }
    },
  }
}

export type AiGateway = ReturnType<typeof createAiGateway>

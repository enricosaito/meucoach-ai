import { AppError, noopLogger, type Logger } from '../../../shared'
import { estimateCostUsd } from './pricing'
import { DEFAULT_MODELS, type AiModelTier } from './registry'
import type {
  AiProvider,
  ChatTurn,
  ContentPart,
  ProviderChatResult,
  ProviderStructuredRequest,
} from './types'

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

interface CallMeta {
  userId: string
  feature: string
  promptVersion: string
  requestId?: string | undefined
  /** Defaults to `fast`. */
  tier?: AiModelTier
}

export interface GatewayChatInput extends CallMeta {
  request: { system: string; messages: ChatTurn[]; maxTokens: number }
}

export interface GatewayChatResult extends ProviderChatResult {
  aiCallId: string
}

export interface GatewayStructuredInput<T> extends CallMeta {
  system: string
  content: ContentPart[]
  schema: ProviderStructuredRequest<T>['schema']
  maxTokens: number
  effort?: ProviderStructuredRequest<T>['effort']
  mock: () => T
}

export interface GatewayStructuredResult<T> {
  /** Null when the model refused or the output did not match the schema. */
  data: T | null
  refused: boolean
  model: string
  aiCallId: string
}

/**
 * The single entry point for every AI call: picks the provider and model, measures latency,
 * estimates cost and records the call in `ai_calls` whether it succeeds or fails.
 */
export function createAiGateway(deps: {
  provider: AiProvider
  recordCall: AiCallRecorder
  models?: Partial<Record<AiModelTier, string>>
  logger?: Logger
  now?: () => number
}) {
  const { provider, recordCall } = deps
  const logger = deps.logger ?? noopLogger
  const now = deps.now ?? (() => performance.now())
  const models = { ...DEFAULT_MODELS, ...deps.models }

  async function track<R extends { model: string; inputTokens: number; outputTokens: number }>(
    meta: CallMeta,
    call: (model: string) => Promise<R>,
  ): Promise<R & { aiCallId: string }> {
    const model = models[meta.tier ?? 'fast']
    const started = now()
    const base = {
      userId: meta.userId,
      feature: meta.feature,
      provider: provider.name,
      promptVersion: meta.promptVersion,
      requestId: meta.requestId ?? null,
    }

    let result: R
    try {
      result = await call(model)
    } catch (error) {
      const latencyMs = Math.round(now() - started)
      const message = error instanceof Error ? error.message : String(error)
      logger.error(
        { err: error, requestId: base.requestId, feature: meta.feature, model, latencyMs },
        'ai call failed',
      )
      await recordCall({
        ...base,
        model,
        inputTokens: 0,
        outputTokens: 0,
        costUsd: 0,
        latencyMs,
        status: 'failed',
        error: message.slice(0, 1000),
      }).catch((recordError: unknown) => {
        logger.error({ err: recordError }, 'failed to record ai call')
      })
      throw new AppError('ai_unavailable', 'The AI is unavailable right now. Try again.', {
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
      {
        requestId: base.requestId,
        feature: meta.feature,
        model: result.model,
        latencyMs,
        costUsd,
        aiCallId: id,
      },
      'ai call succeeded',
    )
    return { ...result, aiCallId: id }
  }

  return {
    providerName: provider.name,

    chat(input: GatewayChatInput): Promise<GatewayChatResult> {
      return track(input, (model) => provider.chat({ ...input.request, model }))
    },

    async structured<T>(input: GatewayStructuredInput<T>): Promise<GatewayStructuredResult<T>> {
      const result = await track(input, (model) =>
        provider.structured({
          model,
          system: input.system,
          content: input.content,
          schema: input.schema,
          maxTokens: input.maxTokens,
          effort: input.effort ?? 'medium',
          mock: input.mock,
        }),
      )
      return {
        data: result.data,
        refused: result.refused,
        model: result.model,
        aiCallId: result.aiCallId,
      }
    },
  }
}

export type AiGateway = ReturnType<typeof createAiGateway>

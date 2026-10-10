import type { z } from 'zod'

export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

export interface ProviderChatRequest {
  model: string
  system: string
  messages: ChatTurn[]
  maxTokens: number
}

export interface ProviderChatResult {
  text: string
  model: string
  inputTokens: number
  outputTokens: number
  /** True when the model declined to answer (safety refusal). */
  refused: boolean
}

export type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/webp'

export type ContentPart =
  { type: 'text'; text: string } | { type: 'image'; mediaType: ImageMediaType; base64: string }

export interface ProviderStructuredRequest<T> {
  model: string
  system: string
  content: ContentPart[]
  /** Output schema. Providers that support it constrain generation to this schema. */
  schema: z.ZodType<T>
  maxTokens: number
  effort: 'low' | 'medium' | 'high'
  /**
   * Deterministic result used by the mock provider (local dev and tests). Real providers ignore it.
   * Keeping it next to the call means every structured feature works end to end for free.
   */
  mock: () => T
}

export interface ProviderStructuredResult<T> {
  /** Null when the model refused or produced output that failed schema validation. */
  data: T | null
  model: string
  inputTokens: number
  outputTokens: number
  refused: boolean
}

/** Every AI vendor integration implements this. Add new capabilities here, never call SDKs directly. */
export interface AiProvider {
  readonly name: string
  chat(request: ProviderChatRequest): Promise<ProviderChatResult>
  structured<T>(request: ProviderStructuredRequest<T>): Promise<ProviderStructuredResult<T>>
}

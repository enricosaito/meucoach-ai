import { createAnthropicProvider } from './providers/anthropic'
import { createMockProvider } from './providers/mock'
import type { AiProvider } from './types'

export const AI_PROVIDER_NAMES = ['mock', 'anthropic'] as const
export type AiProviderName = (typeof AI_PROVIDER_NAMES)[number]

/**
 * Callers pick a tier, never a model. `fast` = interactive chat (cheaper, low latency);
 * `smart` = high-stakes generation such as workout plans and photo analysis.
 */
export const AI_MODEL_TIERS = ['fast', 'smart'] as const
export type AiModelTier = (typeof AI_MODEL_TIERS)[number]

export const DEFAULT_MODELS: Readonly<Record<AiModelTier, string>> = {
  fast: 'claude-sonnet-5-5',
  smart: 'claude-opus-5-5',
}

export interface AiProviderConfig {
  provider: AiProviderName
  anthropicApiKey?: string | undefined
  mockDelayMs?: number | undefined
}

export function createAiProvider(config: AiProviderConfig): AiProvider {
  switch (config.provider) {
    case 'mock':
      return createMockProvider({ delayMs: config.mockDelayMs })
    case 'anthropic':
      if (!config.anthropicApiKey) {
        throw new Error('AI_PROVIDER=anthropic requires ANTHROPIC_API_KEY')
      }
      return createAnthropicProvider({ apiKey: config.anthropicApiKey })
  }
}

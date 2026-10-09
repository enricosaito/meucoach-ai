import { createAnthropicProvider } from './providers/anthropic'
import { createMockProvider } from './providers/mock'
import type { AiProvider } from './types'

export const AI_PROVIDER_NAMES = ['mock', 'anthropic'] as const
export type AiProviderName = (typeof AI_PROVIDER_NAMES)[number]

export interface AiProviderConfig {
  provider: AiProviderName
  anthropicApiKey?: string | undefined
  model?: string | undefined
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
      return createAnthropicProvider({ apiKey: config.anthropicApiKey, model: config.model })
  }
}

import Anthropic from '@anthropic-ai/sdk'
import type { AiProvider, ProviderChatRequest, ProviderChatResult } from '../types'

export const DEFAULT_ANTHROPIC_MODEL = 'claude-opus-5-5'

/** Real Claude provider. Only constructed when AI_PROVIDER=anthropic and an API key is set. */
export function createAnthropicProvider(options: { apiKey: string; model?: string }): AiProvider {
  const client = new Anthropic({ apiKey: options.apiKey })
  const model = options.model ?? DEFAULT_ANTHROPIC_MODEL

  return {
    name: 'anthropic',
    async chat(request: ProviderChatRequest): Promise<ProviderChatResult> {
      const response = await client.beta.messages.create({
        model,
        max_tokens: request.maxTokens,
        system: request.system,
        messages: request.messages,
        // Chat is latency-sensitive and simple: low effort keeps cost and latency down.
        output_config: { effort: 'low' },
        // On a safety refusal, transparently retry on the API's default fallback model.
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
      })

      const text = response.content
        .flatMap((block) => (block.type === 'text' ? [block.text] : []))
        .join('')
        .trim()

      return {
        text,
        model: response.model,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        refused: response.stop_reason === 'refusal',
      }
    },
  }
}

import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import type {
  AiProvider,
  ContentPart,
  ProviderChatRequest,
  ProviderChatResult,
  ProviderStructuredRequest,
  ProviderStructuredResult,
} from '../types'
import { supportsServerFallback } from '../model-features'

function toContentBlocks(parts: ContentPart[]): Anthropic.ContentBlockParam[] {
  return parts.map((part) =>
    part.type === 'text'
      ? { type: 'text', text: part.text }
      : {
          type: 'image',
          source: { type: 'base64', media_type: part.mediaType, data: part.base64 },
        },
  )
}

/** Real Claude provider. Only constructed when AI_PROVIDER=anthropic and an API key is set. */
export function createAnthropicProvider(options: { apiKey: string }): AiProvider {
  const client = new Anthropic({ apiKey: options.apiKey })

  return {
    name: 'anthropic',

    async chat(request: ProviderChatRequest): Promise<ProviderChatResult> {
      const response = await client.beta.messages.create({
        model: request.model,
        max_tokens: request.maxTokens,
        system: request.system,
        messages: request.messages.map((turn) => ({
          role: turn.role,
          content: typeof turn.content === 'string' ? turn.content : toContentBlocks(turn.content),
        })),
        // Chat is latency-sensitive and simple: low effort keeps cost and latency down.
        output_config: { effort: 'low' },
        // On a safety refusal, transparently retry on the API's default fallback model, where
        // the model supports it (Haiku doesn't; its refusals surface as `refused`).
        ...(supportsServerFallback(request.model) && {
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default' as const,
        }),
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

    async structured<T>(
      request: ProviderStructuredRequest<T>,
    ): Promise<ProviderStructuredResult<T>> {
      const response = await client.messages.parse({
        model: request.model,
        max_tokens: request.maxTokens,
        system: request.system,
        messages: [{ role: 'user', content: toContentBlocks(request.content) }],
        output_config: {
          effort: request.effort,
          format: zodOutputFormat(request.schema),
        },
      })
      const refused = response.stop_reason === 'refusal'
      return {
        data: refused ? null : (response.parsed_output ?? null),
        model: response.model,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        refused,
      }
    },
  }
}

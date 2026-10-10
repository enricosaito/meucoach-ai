// Per-model API capabilities the Anthropic provider needs to know about.

/**
 * Models that support the API's server-side refusal fallback (`fallbacks: "default"`): a
 * declined request is retried on a fallback model inside the same call. Claude Haiku 5.5 has
 * none, so its requests must not send the parameter (a refusal there is handled by the caller).
 */
const SERVER_FALLBACK_MODELS: ReadonlySet<string> = new Set([
  'claude-fable-5-1',
  'claude-opus-5-5',
  'claude-opus-5',
  'claude-sonnet-5-5',
])

export function supportsServerFallback(model: string): boolean {
  return SERVER_FALLBACK_MODELS.has(model)
}

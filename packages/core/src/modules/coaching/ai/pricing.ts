/** USD per 1M tokens. Update when vendor pricing changes. Unknown models are costed at 0. */
const PRICES_PER_MTOK: Readonly<Record<string, { input: number; output: number }>> = {
  'claude-opus-5-5': { input: 4, output: 20 },
  'claude-sonnet-5-5': { input: 2, output: 10 },
  'claude-haiku-5-5': { input: 0.1, output: 0.5 },
  mock: { input: 0, output: 0 },
}

export function estimateCostUsd(model: string, inputTokens: number, outputTokens: number): number {
  const price = PRICES_PER_MTOK[model]
  if (!price) return 0
  const cost = (inputTokens * price.input + outputTokens * price.output) / 1_000_000
  return Math.round(cost * 1_000_000) / 1_000_000
}

import type { AiProvider, ProviderChatRequest, ProviderChatResult } from '../types'

const TIPS = [
  'Aim for a palm-sized portion of protein at most meals.',
  'Consistency beats perfection: small daily habits compound.',
  'Prioritise 7–9 hours of sleep; it affects appetite and recovery.',
  'A modest deficit of 300–500 kcal/day is sustainable for most people.',
  'Walking more is the easiest way to raise daily energy expenditure.',
]

function hash(text: string): number {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0
  return h
}

/** ~4 characters per token: good enough for local cost/latency dashboards. */
function approxTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4))
}

/**
 * Deterministic, free provider used by default in local dev and tests.
 * The same question always yields the same answer.
 */
export function createMockProvider(options: { delayMs?: number } = {}): AiProvider {
  const delayMs = options.delayMs ?? 400
  return {
    name: 'mock',
    async chat(request: ProviderChatRequest): Promise<ProviderChatResult> {
      if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs))
      const question = request.messages.at(-1)?.content ?? ''
      const tip = TIPS[hash(question) % TIPS.length] ?? ''
      const tdee = /TDEE: (\d+) kcal/.exec(request.system)?.[1]
      const text = [
        `(mock coach) You asked: "${question.slice(0, 200)}".`,
        tdee
          ? `Based on your last test, your estimated maintenance is about ${tdee} kcal/day.`
          : 'Take the Mifflin-St Jeor test so I can personalise calorie advice.',
        tip,
      ].join(' ')
      const input = request.system + request.messages.map((m) => m.content).join('\n')
      return {
        text,
        model: 'mock',
        inputTokens: approxTokens(input),
        outputTokens: approxTokens(text),
        refused: false,
      }
    },
  }
}

import type {
  AiProvider,
  ProviderChatRequest,
  ProviderChatResult,
  ProviderStructuredRequest,
  ProviderStructuredResult,
} from '../types'

// A canned, deterministic "coach". It never calls a model: it echoes the question, quotes numbers
// it finds in the system prompt, adds one fixed tip, and answers in the language the prompt asks for.

const COPY = {
  en: {
    asked: (q: string) => `(mock coach) You asked: "${q}".`,
    targets: (kcal: string, protein: string) =>
      `Your daily targets are about **${kcal} kcal** and **${protein} g of protein**.`,
    tdee: (tdee: string) =>
      `Based on your last test, your estimated maintenance is about ${tdee} kcal/day.`,
    noTest: 'Take the energy test so I can personalise calorie advice.',
    tips: [
      'Aim for a palm-sized portion of protein at most meals.',
      'Consistency beats perfection: small daily habits compound.',
      'Prioritise 7–9 hours of sleep; it affects appetite and recovery.',
      'Add a little weight or one more rep each week: that is progressive overload.',
      'Walking more is the easiest way to raise daily energy expenditure.',
    ],
  },
  pt: {
    asked: (q: string) => `(coach simulado) Você perguntou: "${q}".`,
    targets: (kcal: string, protein: string) =>
      `Suas metas diárias são cerca de **${kcal} kcal** e **${protein} g de proteína**.`,
    tdee: (tdee: string) =>
      `Pelo seu último teste, sua manutenção estimada é de cerca de ${tdee} kcal/dia.`,
    noTest: 'Faça o teste de energia para eu personalizar as dicas de calorias.',
    tips: [
      'Tente incluir uma porção de proteína do tamanho da palma da mão na maioria das refeições.',
      'Consistência vence perfeição: pequenos hábitos diários se acumulam.',
      'Priorize 7–9 horas de sono; isso afeta o apetite e a recuperação.',
      'Aumente um pouco a carga ou faça uma repetição a mais por semana: isso é sobrecarga progressiva.',
      'Caminhar mais é o jeito mais fácil de aumentar seu gasto diário.',
    ],
  },
}

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
      const copy = request.system.includes('Reply in Brazilian Portuguese') ? COPY.pt : COPY.en
      const question = request.messages.at(-1)?.content ?? ''
      const targets = /Daily targets: (\d+) kcal, protein (\d+) g/.exec(request.system)
      const tdee = /TDEE: (\d+) kcal/.exec(request.system)?.[1]
      const text = [
        copy.asked(question.slice(0, 200)),
        targets?.[1] && targets[2]
          ? copy.targets(targets[1], targets[2])
          : tdee
            ? copy.tdee(tdee)
            : copy.noTest,
        copy.tips[hash(question) % copy.tips.length] ?? '',
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

    async structured<T>(
      request: ProviderStructuredRequest<T>,
    ): Promise<ProviderStructuredResult<T>> {
      if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs))
      // Validate the canned result like a real one, so schema drift shows up in local dev.
      const data = request.schema.parse(request.mock())
      const imageCount = request.content.filter((part) => part.type === 'image').length
      const text = request.content.map((part) => (part.type === 'text' ? part.text : '')).join('\n')
      return {
        data,
        model: 'mock',
        inputTokens: approxTokens(request.system + text) + imageCount * 1500,
        outputTokens: approxTokens(JSON.stringify(data)),
        refused: false,
      }
    },
  }
}

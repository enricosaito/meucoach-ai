// Speech-to-text for coach voice notes. Claude doesn't take audio input, so voice notes are
// transcribed first (OpenAI) and the coach answers the transcript. Audio is never stored.
// Like every AI call, transcriptions go through the gateway (which records them in ai_calls).

export const TRANSCRIPTION_PROVIDER_NAMES = ['mock', 'openai'] as const
export type TranscriptionProviderName = (typeof TRANSCRIPTION_PROVIDER_NAMES)[number]

export const DEFAULT_TRANSCRIPTION_MODEL = 'gpt-4o-mini-transcribe'

export interface TranscribeRequest {
  base64: string
  mediaType: string
  /** ISO 639-1 hint ("pt", "en"): faster and more accurate than auto-detect. */
  language: string
}

export interface TranscriptionProvider {
  name: TranscriptionProviderName
  model: string
  /** List price per audio minute, for the cost estimate in ai_calls. */
  usdPerMinute: number
  transcribe(request: TranscribeRequest): Promise<{ text: string }>
}

const EXTENSIONS: Record<string, string> = {
  'audio/m4a': 'm4a',
  'audio/x-m4a': 'm4a',
  'audio/mp4': 'm4a',
  'audio/aac': 'aac',
  'audio/webm': 'webm',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
}

/** Deterministic, free transcriber for local dev and tests. */
export function createMockTranscriber(): TranscriptionProvider {
  return {
    name: 'mock',
    model: 'mock',
    usdPerMinute: 0,
    transcribe(request) {
      return Promise.resolve({
        text:
          request.language === 'pt'
            ? 'Mensagem de voz de teste: como foi meu treino ontem?'
            : 'Test voice message: how was my workout yesterday?',
      })
    },
  }
}

/** OpenAI's transcription endpoint, called with fetch (no SDK). */
export function createOpenAiTranscriber(options: {
  apiKey: string
  model?: string | undefined
  fetch?: typeof fetch
}): TranscriptionProvider {
  const model = options.model ?? DEFAULT_TRANSCRIPTION_MODEL
  const doFetch = options.fetch ?? fetch
  return {
    name: 'openai',
    model,
    // gpt-4o-mini-transcribe list price when this was written; check OpenAI's pricing page.
    usdPerMinute: 0.003,
    async transcribe(request) {
      const form = new FormData()
      const bytes = Uint8Array.from(atob(request.base64), (c) => c.charCodeAt(0))
      const extension = EXTENSIONS[request.mediaType] ?? 'm4a'
      form.append('file', new Blob([bytes], { type: request.mediaType }), `voice.${extension}`)
      form.append('model', model)
      form.append('language', request.language)
      form.append('response_format', 'json')
      const response = await doFetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${options.apiKey}` },
        body: form,
      })
      if (!response.ok) {
        const detail = (await response.text()).slice(0, 300)
        throw new Error(`OpenAI transcription failed (${String(response.status)}): ${detail}`)
      }
      const body = (await response.json()) as { text?: unknown }
      return { text: typeof body.text === 'string' ? body.text : '' }
    },
  }
}

export function createTranscriber(config: {
  provider: TranscriptionProviderName
  openAiApiKey?: string | undefined
  model?: string | undefined
}): TranscriptionProvider {
  switch (config.provider) {
    case 'mock':
      return createMockTranscriber()
    case 'openai':
      if (!config.openAiApiKey) {
        throw new Error('TRANSCRIPTION_PROVIDER=openai requires OPENAI_API_KEY')
      }
      return createOpenAiTranscriber({ apiKey: config.openAiApiKey, model: config.model })
  }
}

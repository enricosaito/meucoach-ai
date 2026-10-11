import { describe, expect, it } from 'vitest'
import { createOpenAiTranscriber, createTranscriber } from './transcription'

describe('OpenAI transcriber', () => {
  it('posts the audio as a file with the model and language, and returns the text', async () => {
    let seen: { url: string; init: RequestInit } | null = null
    const fakeFetch = ((url: string, init: RequestInit) => {
      seen = { url, init }
      return Promise.resolve(new Response(JSON.stringify({ text: ' oi coach ' }), { status: 200 }))
    }) as unknown as typeof fetch
    const transcriber = createOpenAiTranscriber({ apiKey: 'sk-test', fetch: fakeFetch })

    const result = await transcriber.transcribe({
      base64: btoa('fake audio'),
      mediaType: 'audio/m4a',
      language: 'pt',
    })

    expect(result.text).toBe(' oi coach ')
    expect(seen).not.toBeNull()
    const { url, init } = seen as unknown as { url: string; init: RequestInit }
    expect(url).toBe('https://api.openai.com/v1/audio/transcriptions')
    expect(init.headers).toEqual({ Authorization: 'Bearer sk-test' })
    const form = init.body as FormData
    expect(form.get('model')).toBe('gpt-4o-mini-transcribe')
    expect(form.get('language')).toBe('pt')
    const file = form.get('file') as File
    expect(file.name).toBe('voice.m4a')
    expect(await file.text()).toBe('fake audio')
  })

  it('throws with the status when OpenAI fails', async () => {
    const fakeFetch = (() =>
      Promise.resolve(new Response('bad key', { status: 401 }))) as unknown as typeof fetch
    const transcriber = createOpenAiTranscriber({ apiKey: 'x', fetch: fakeFetch })
    await expect(
      transcriber.transcribe({ base64: btoa('a'), mediaType: 'audio/webm', language: 'en' }),
    ).rejects.toThrow('OpenAI transcription failed (401): bad key')
  })

  it('requires a key for the openai provider', () => {
    expect(() => createTranscriber({ provider: 'openai' })).toThrow('OPENAI_API_KEY')
    expect(createTranscriber({ provider: 'mock' }).name).toBe('mock')
  })
})

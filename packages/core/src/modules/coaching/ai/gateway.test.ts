import { describe, expect, it, vi } from 'vitest'
import { AppError } from '../../../shared'
import { createAiGateway, type AiCallRecord } from './gateway'
import type { AiProvider } from './types'

const request = {
  system: 'sys',
  messages: [{ role: 'user' as const, content: 'hi' }],
  maxTokens: 100,
}

function fakeClock(...times: number[]) {
  return () => times.shift() ?? 0
}

describe('createAiGateway', () => {
  it('records a successful call with cost and latency', async () => {
    const records: AiCallRecord[] = []
    const provider: AiProvider = {
      name: 'fake',
      chat: () =>
        Promise.resolve({
          text: 'hello',
          model: 'claude-opus-5-5',
          inputTokens: 1000,
          outputTokens: 500,
          refused: false,
        }),
    }
    const gateway = createAiGateway({
      provider,
      recordCall: (record) => {
        records.push(record)
        return Promise.resolve({ id: 'call-1' })
      },
      now: fakeClock(100, 350),
    })

    const result = await gateway.chat({
      userId: 'u1',
      feature: 'coach_chat',
      promptVersion: 'coach-chat@1',
      requestId: 'req-1',
      request,
    })

    expect(result.aiCallId).toBe('call-1')
    expect(records).toEqual([
      expect.objectContaining({
        userId: 'u1',
        provider: 'fake',
        model: 'claude-opus-5-5',
        promptVersion: 'coach-chat@1',
        latencyMs: 250,
        costUsd: 0.014,
        status: 'succeeded',
        requestId: 'req-1',
      }),
    ])
  })

  it('records a failed call and throws ai_unavailable', async () => {
    const recordCall = vi.fn(() => Promise.resolve({ id: 'call-2' }))
    const gateway = createAiGateway({
      provider: { name: 'fake', chat: () => Promise.reject(new Error('boom')) },
      recordCall,
      now: fakeClock(0, 40),
    })

    const promise = gateway.chat({ userId: 'u1', feature: 'f', promptVersion: 'p@1', request })
    await expect(promise).rejects.toBeInstanceOf(AppError)
    await expect(promise).rejects.toMatchObject({ code: 'ai_unavailable' })
    expect(recordCall).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'failed', error: 'boom', latencyMs: 40 }),
    )
  })
})

import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
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

function fakeProvider(overrides: Partial<AiProvider> = {}): AiProvider {
  return {
    name: 'fake',
    chat: (req) =>
      Promise.resolve({
        text: 'hello',
        model: req.model,
        inputTokens: 1000,
        outputTokens: 500,
        refused: false,
      }),
    structured: (req) =>
      Promise.resolve({
        data: req.mock(),
        model: req.model,
        inputTokens: 2000,
        outputTokens: 1000,
        refused: false,
      }),
    ...overrides,
  }
}

function recorder() {
  const records: AiCallRecord[] = []
  return {
    records,
    recordCall: (record: AiCallRecord) => {
      records.push(record)
      return Promise.resolve({ id: `call-${records.length}` })
    },
  }
}

describe('createAiGateway', () => {
  it('records a successful chat call with cost and latency, on the fast tier by default', async () => {
    const { records, recordCall } = recorder()
    const gateway = createAiGateway({
      provider: fakeProvider(),
      recordCall,
      models: { fast: 'claude-opus-5-5' },
      now: fakeClock(100, 350),
    })

    const result = await gateway.chat({
      userId: 'u1',
      feature: 'coach_chat',
      promptVersion: 'coach-chat@2',
      requestId: 'req-1',
      request,
    })

    expect(result.aiCallId).toBe('call-1')
    expect(records).toEqual([
      expect.objectContaining({
        userId: 'u1',
        provider: 'fake',
        model: 'claude-opus-5-5',
        latencyMs: 250,
        costUsd: 0.014, // 1000 × $4/M + 500 × $20/M
        status: 'succeeded',
        requestId: 'req-1',
      }),
    ])
  })

  it('uses the smart-tier model for structured calls and returns schema data', async () => {
    const { records, recordCall } = recorder()
    const provider = fakeProvider()
    const structured = vi.spyOn(provider, 'structured')
    const gateway = createAiGateway({ provider, recordCall })

    const result = await gateway.structured({
      userId: 'u1',
      feature: 'workout_plan',
      promptVersion: 'plan@1',
      tier: 'smart',
      system: 's',
      content: [{ type: 'text', text: 'make a plan' }],
      schema: z.object({ ok: z.boolean() }),
      maxTokens: 100,
      mock: () => ({ ok: true }),
    })

    expect(result).toEqual({
      data: { ok: true },
      refused: false,
      model: 'claude-opus-5-5',
      aiCallId: 'call-1',
    })
    expect(structured).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'claude-opus-5-5', effort: 'medium' }),
    )
    expect(records[0]).toMatchObject({ feature: 'workout_plan', status: 'succeeded' })
  })

  it('records a failed call and throws ai_unavailable', async () => {
    const recordCall = vi.fn(() => Promise.resolve({ id: 'call-2' }))
    const gateway = createAiGateway({
      provider: fakeProvider({ chat: () => Promise.reject(new Error('boom')) }),
      recordCall,
      now: fakeClock(0, 40),
    })

    const promise = gateway.chat({ userId: 'u1', feature: 'f', promptVersion: 'p@1', request })
    await expect(promise).rejects.toBeInstanceOf(AppError)
    await expect(promise).rejects.toMatchObject({ code: 'ai_unavailable' })
    expect(recordCall).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'failed',
        error: 'boom',
        latencyMs: 40,
        model: 'claude-sonnet-5-5',
      }),
    )
  })
})

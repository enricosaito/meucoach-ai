import { describe, expect, it } from 'vitest'
import { CHAT_MESSAGE_MAX_LENGTH, sendChatMessageSchema } from './schemas'

describe('sendChatMessageSchema', () => {
  it('trims content', () => {
    expect(sendChatMessageSchema.parse({ content: '  how much protein?  ' })).toEqual({
      content: 'how much protein?',
    })
  })

  it.each([
    ['empty', ''],
    ['whitespace only', '   '],
    ['too long', 'x'.repeat(CHAT_MESSAGE_MAX_LENGTH + 1)],
  ])('rejects %s content', (_label, content) => {
    expect(sendChatMessageSchema.safeParse({ content }).success).toBe(false)
  })

  it('rejects unknown keys', () => {
    expect(sendChatMessageSchema.safeParse({ content: 'hi', role: 'assistant' }).success).toBe(
      false,
    )
  })
})

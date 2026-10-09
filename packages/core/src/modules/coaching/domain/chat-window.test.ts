import { describe, expect, it } from 'vitest'
import type { ChatTurn } from '../ai/types'
import { buildChatWindow } from './chat-window'

const u = (content: string): ChatTurn => ({ role: 'user', content })
const a = (content: string): ChatTurn => ({ role: 'assistant', content })

describe('buildChatWindow', () => {
  it('appends the question to an empty history', () => {
    expect(buildChatWindow([], 'hi')).toEqual([u('hi')])
  })

  it('keeps history in order and appends the question', () => {
    expect(buildChatWindow([u('1'), a('2')], '3')).toEqual([u('1'), a('2'), u('3')])
  })

  it('keeps only the most recent turns', () => {
    const history = [u('1'), a('2'), u('3'), a('4'), u('5'), a('6')]
    expect(buildChatWindow(history, '7', 4)).toEqual([u('3'), a('4'), u('5'), a('6'), u('7')])
  })

  it('drops a leading assistant turn left over after trimming', () => {
    const history = [u('1'), a('2'), u('3'), a('4')]
    expect(buildChatWindow(history, '5', 3)).toEqual([u('3'), a('4'), u('5')])
  })

  it('handles a zero-turn window', () => {
    expect(buildChatWindow([u('1'), a('2')], '3', 0)).toEqual([u('3')])
  })
})

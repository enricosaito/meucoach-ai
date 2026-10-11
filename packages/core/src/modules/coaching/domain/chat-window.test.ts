import { describe, expect, it } from 'vitest'
import type { ChatTurn } from '../ai/types'
import { OPENED_APP_TURN, buildChatWindow, historyTurn } from './chat-window'

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

  it('keeps a check-in that starts the thread, after an "opened the app" turn', () => {
    expect(buildChatWindow([a('Como foi o treino?')], 'Ótimo')).toEqual([
      u(OPENED_APP_TURN),
      a('Como foi o treino?'),
      u('Ótimo'),
    ])
  })

  it('handles a zero-turn window', () => {
    expect(buildChatWindow([u('1'), a('2')], '3', 0)).toEqual([u('3')])
  })
})

describe('historyTurn', () => {
  const base = {
    role: 'user' as const,
    content: 'olha meu almoço',
    hasImage: false,
    viaVoice: false,
  }

  it('keeps plain messages as they are', () => {
    expect(historyTurn(base)).toEqual({ role: 'user', content: 'olha meu almoço' })
  })

  it('notes a photo that is no longer available', () => {
    expect(historyTurn({ ...base, hasImage: true }).content).toBe(
      '[The user sent a photo here; it is no longer available.] olha meu almoço',
    )
    expect(historyTurn({ ...base, content: '', hasImage: true }).content).toBe(
      '[The user sent a photo here; it is no longer available.]',
    )
  })

  it('marks voice notes as transcripts', () => {
    expect(historyTurn({ ...base, viaVoice: true }).content).toBe(
      '[Voice note, transcribed] olha meu almoço',
    )
  })
})

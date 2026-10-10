import { describe, expect, it } from 'vitest'
import type { CoachingContext } from '../../profile/contracts'
import { buildSystemPrompt, version } from './coach-chat.v2'

const base: CoachingContext = {
  displayName: 'Ana',
  units: 'metric',
  locale: 'pt-BR',
  timezone: 'America/Sao_Paulo',
  goals: {},
  latestAssessment: null,
}

const assessment = {
  id: 'a1',
  formula: 'mifflin_st_jeor',
  formulaVersion: 1,
  sex: 'male' as const,
  ageYears: 30,
  heightCm: 180,
  weightKg: 80,
  activityLevel: 'moderate' as const,
  bmrKcal: 1780,
  tdeeKcal: 2759,
  createdAt: '2026-10-01T12:00:00Z',
}

// 2026-10-10 is a Saturday; 13:00 UTC is 10:00 in São Paulo (UTC−3).
const now = new Date('2026-10-10T13:00:00Z')

describe('coach-chat v2 system prompt', () => {
  it('has a stable version id', () => {
    expect(version).toBe('coach-chat@2')
  })

  it('asks for replies in the user’s language', () => {
    expect(buildSystemPrompt(base, { now })).toContain('Reply in Brazilian Portuguese')
    expect(buildSystemPrompt({ ...base, locale: 'en' }, { now })).toContain('Reply in English')
  })

  it('includes the user’s local day and part of day', () => {
    expect(buildSystemPrompt(base, { now })).toContain('Saturday morning (America/Sao_Paulo)')
  })

  it('falls back to UTC for an invalid time zone', () => {
    expect(buildSystemPrompt({ ...base, timezone: 'Nope/Nowhere' }, { now })).toContain(
      'Saturday afternoon',
    )
  })

  it('adds goal-specific guidance', () => {
    const prompt = buildSystemPrompt({ ...base, goals: { primary: 'build_muscle' } }, { now })
    expect(prompt).toContain('Goal: build muscle')
    expect(prompt).toContain('progressive overload')
  })

  it('includes daily macro targets computed from the latest test and goal', () => {
    const prompt = buildSystemPrompt(
      { ...base, goals: { primary: 'lose_fat' }, latestAssessment: assessment },
      { now },
    )
    expect(prompt).toContain('TDEE: 2759 kcal/day')
    expect(prompt).toContain('Daily targets: 2210 kcal, protein 176 g')
  })

  it('asks the user to take the test when there are no targets', () => {
    expect(buildSystemPrompt(base, { now })).toContain('No energy test yet')
  })

  it('uses the user’s unit system', () => {
    expect(buildSystemPrompt({ ...base, units: 'imperial' }, { now })).toContain('imperial units')
  })
})

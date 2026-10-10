import { describe, expect, it } from 'vitest'
import { buildSystemPrompt, version } from './coach-chat.v1'

const base = {
  displayName: 'Ana',
  units: 'metric' as const,
  locale: 'en' as const,
  timezone: 'UTC',
  goals: {},
  latestAssessment: null,
}

describe('coach-chat v1 system prompt', () => {
  it('has a stable version id', () => {
    expect(version).toBe('coach-chat@1')
  })

  it('suggests the test when there is no assessment', () => {
    expect(buildSystemPrompt(base)).toContain('No energy expenditure test yet')
  })

  it('includes BMR and TDEE from the latest assessment', () => {
    const prompt = buildSystemPrompt({
      ...base,
      goals: { primary: 'lose_fat' },
      latestAssessment: {
        id: 'a1',
        formula: 'mifflin_st_jeor',
        formulaVersion: 1,
        sex: 'female',
        ageYears: 30,
        heightCm: 165,
        weightKg: 62,
        activityLevel: 'moderate',
        bmrKcal: 1350,
        tdeeKcal: 2093,
        createdAt: '2026-10-01T12:00:00Z',
      },
    })
    expect(prompt).toContain('BMR: 1350 kcal/day; TDEE: 2093 kcal/day')
    expect(prompt).toContain('Primary goal: lose fat')
    expect(prompt).toContain('moderately active')
  })
})

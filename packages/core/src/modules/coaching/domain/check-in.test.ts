import { describe, expect, it } from 'vitest'
import type { CoachingContext } from '../../profile/contracts'
import type { CoachSnapshot } from '../../training/contracts'
import { buildCheckInFacts, describeFacts, fallbackCheckIn } from './check-in'

const context: CoachingContext = {
  displayName: 'Ana Souza',
  units: 'metric',
  locale: 'pt-BR',
  timezone: 'America/Sao_Paulo',
  goals: { primary: 'build_muscle' },
  latestAssessment: null,
}

const plan: NonNullable<CoachSnapshot['plan']> = {
  id: 'p1',
  days: [
    { title: 'Dia 1 · Superiores', focus: 'Peito e costas' },
    { title: 'Dia 2 · Inferiores', focus: 'Pernas e glúteos' },
  ],
}

function session(localDate: string, dayIndex: number) {
  return {
    id: `${localDate}-${String(dayIndex)}`,
    planId: 'p1',
    dayIndex,
    dayTitle: plan.days[dayIndex]?.title ?? '',
    localDate,
    createdAt: `${localDate}T12:00:00Z`,
  }
}

const facts = (snapshot: Partial<CoachSnapshot>, today = '2026-10-15') =>
  buildCheckInFacts({
    context,
    snapshot: { plan, sessions: [], limitations: null, ...snapshot },
    streak: { current: 4 },
    recentChat: [],
    today,
  })

describe('buildCheckInFacts', () => {
  it("knows yesterday's workout and today's next one", () => {
    const f = facts({ sessions: [session('2026-10-14', 1)] })
    expect(f.firstName).toBe('Ana')
    expect(f.yesterdayWorkout).toEqual(plan.days[1])
    expect(f.todayWorkout).toEqual({ ...plan.days[0], done: false })
    expect(f.daysSinceLastWorkout).toBe(1)
    expect(f.weeklyTarget).toBe(2)
  })

  it('counts days since the last workout', () => {
    expect(facts({ sessions: [session('2026-10-10', 0)] }).daysSinceLastWorkout).toBe(5)
    expect(facts({}).daysSinceLastWorkout).toBeNull()
  })

  it('trims long chat messages and keeps only the last six', () => {
    const recentChat = Array.from({ length: 8 }, (_, i) => ({
      role: 'user' as const,
      content: `${String(i)} ${'x'.repeat(400)}`,
    }))
    const f = buildCheckInFacts({
      context,
      snapshot: { plan, sessions: [], limitations: null },
      streak: { current: 0 },
      recentChat,
      today: '2026-10-15',
    })
    expect(f.recentChat).toHaveLength(6)
    expect(f.recentChat[0]?.content.startsWith('2 ')).toBe(true)
    expect(f.recentChat[0]?.content.endsWith('…')).toBe(true)
  })
})

describe('describeFacts', () => {
  it('lists only what is known, including limitations', () => {
    const text = describeFacts(
      facts({ sessions: [session('2026-10-14', 1)], limitations: 'dor no ombro direito' }),
    )
    expect(text).toContain('Yesterday they trained: Dia 2 · Inferiores (Pernas e glúteos)')
    expect(text).toContain('"dor no ombro direito"')
    expect(text).toContain('App streak: 4 days')
    expect(text).not.toContain('Recent conversation')
  })
})

describe('fallbackCheckIn', () => {
  it("asks about yesterday's workout first", () => {
    const draft = fallbackCheckIn(facts({ sessions: [session('2026-10-14', 1)] }))
    expect(draft.message).toBe(
      'Oi, Ana! Como foi o treino de inferiores ontem? Sentiu alguma coisa diferente?',
    )
    expect(draft.quickReplies).toHaveLength(3)
  })

  it('welcomes them back lightly after a break', () => {
    const draft = fallbackCheckIn(facts({ sessions: [session('2026-10-10', 1)] }))
    expect(draft.message).toContain('Faz 5 dias')
    expect(draft.message).toContain('Sem problema')
  })

  it('asks about a limitation when there is no recent workout to talk about', () => {
    const draft = fallbackCheckIn(facts({ limitations: 'dor no ombro' }))
    expect(draft.message).toContain('"dor no ombro"')
  })

  it('suggests building a plan when there is none', () => {
    expect(fallbackCheckIn(facts({ plan: null })).message).toContain('plano de treino')
  })

  it('speaks English for English users', () => {
    const f = { ...facts({ sessions: [session('2026-10-14', 0)] }), locale: 'en' as const }
    expect(fallbackCheckIn(f).message).toBe(
      'Hi, Ana! How was superiores yesterday? Feel anything unusual?',
    )
  })
})

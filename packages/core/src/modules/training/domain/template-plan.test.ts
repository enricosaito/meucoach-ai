import { describe, expect, it } from 'vitest'
import { workoutPlanSchema } from '../schemas'
import type { PlanInputs } from '../types'
import { normalizeAnalysis, planIssues } from './plan-validation'
import {
  buildMockBodyAnalysis,
  buildTemplatePlan,
  exercisesPerSession,
  splitFor,
} from './template-plan'

const inputs: PlanInputs = {
  questionnaire: {
    experience: 'intermediate',
    daysPerWeek: 4,
    sessionMinutes: 60,
    equipment: 'full_gym',
  },
  goal: 'build_muscle',
  locale: 'pt-BR',
  units: 'metric',
  body: { sex: 'male', ageYears: 30, heightCm: 180, weightKg: 80, activityLevel: 'moderate' },
  targets: null,
}

describe('splitFor', () => {
  it.each([
    [2, 'beginner', ['full_a', 'full_b']],
    [3, 'beginner', ['full_a', 'full_b', 'full_c']],
    [3, 'advanced', ['push', 'pull', 'legs']],
    [4, 'intermediate', ['upper', 'lower', 'upper', 'lower']],
    [6, 'advanced', ['push', 'pull', 'legs', 'push', 'pull', 'legs']],
  ] as const)('%i days (%s)', (days, experience, expected) => {
    expect(splitFor(days, experience)).toEqual(expected)
  })
})

describe('buildTemplatePlan', () => {
  it('produces a schema-valid plan with one day per training day', () => {
    const plan = buildTemplatePlan(inputs)
    expect(workoutPlanSchema.parse(plan)).toEqual(plan)
    expect(plan.days).toHaveLength(4)
    expect(planIssues(plan, inputs)).toEqual([])
  })

  it('fits the number of exercises to the session length', () => {
    for (const minutes of [30, 45, 60, 75, 90] as const) {
      const plan = buildTemplatePlan({
        ...inputs,
        questionnaire: { ...inputs.questionnaire, sessionMinutes: minutes },
      })
      for (const day of plan.days) {
        expect(day.exercises.length).toBeLessThanOrEqual(exercisesPerSession(minutes))
        expect(day.exercises.length).toBeGreaterThanOrEqual(4)
      }
    }
  })

  it('only uses exercises available for the chosen equipment', () => {
    const plan = buildTemplatePlan({
      ...inputs,
      locale: 'en',
      questionnaire: { ...inputs.questionnaire, equipment: 'bodyweight' },
    })
    const names = plan.days.flatMap((d) => d.exercises.map((e) => e.name))
    expect(names.some((n) => /barbell|cable|machine|press$/i.test(n))).toBe(false)
    expect(names).toContain('Push-up')
  })

  it('is written in the user’s language', () => {
    expect(buildTemplatePlan(inputs).days[0]?.title).toBe('Dia 1 · Superiores')
    expect(buildTemplatePlan({ ...inputs, locale: 'en' }).days[0]?.title).toBe('Day 1 · Upper body')
  })

  it('adds a set to exercises for priority areas from the body analysis', () => {
    const analysis = buildMockBodyAnalysis(inputs) // priorities: shoulders, core
    const plain = buildTemplatePlan(inputs)
    const prioritised = buildTemplatePlan(inputs, analysis)
    const shoulder = (p: typeof plain) =>
      p.days[0]?.exercises.find((e) => e.muscleGroup === 'shoulders')
    expect((shoulder(prioritised)?.sets ?? 0) - (shoulder(plain)?.sets ?? 0)).toBe(1)
  })

  it('is deterministic', () => {
    expect(buildTemplatePlan(inputs)).toEqual(buildTemplatePlan(inputs))
  })
})

describe('planIssues', () => {
  it('flags a plan with the wrong number of days or absurd values', () => {
    const plan = buildTemplatePlan(inputs)
    const broken = {
      ...plan,
      days: plan.days
        .slice(0, 3)
        .map((d, i) =>
          i === 0 ? { ...d, exercises: d.exercises.map((e) => ({ ...e, sets: 40 })) } : d,
        ),
    }
    const issues = planIssues(broken, inputs)
    expect(issues).toContain('expected 4 days, got 3')
    expect(issues.some((i) => i.includes('40 sets'))).toBe(true)
  })
})

describe('normalizeAnalysis', () => {
  it('orders and clamps the body-fat range', () => {
    const a = normalizeAnalysis({
      ...buildMockBodyAnalysis(inputs),
      bodyFatPercentLow: 22.4,
      bodyFatPercentHigh: 1,
    })
    expect([a.bodyFatPercentLow, a.bodyFatPercentHigh]).toEqual([3, 22])
  })

  it('keeps at most four priority areas', () => {
    const base = buildMockBodyAnalysis(inputs)
    const many = { ...base, priorityAreas: Array(6).fill(base.priorityAreas[0]) }
    expect(normalizeAnalysis(many).priorityAreas).toHaveLength(4)
  })
})

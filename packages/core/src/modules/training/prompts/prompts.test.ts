import { describe, expect, it } from 'vitest'
import { buildMockBodyAnalysis } from '../domain/template-plan'
import type { PlanInputs } from '../types'
import { bodyAnalysisPrompt, workoutPlanPrompt } from './index'

const inputs: PlanInputs = {
  questionnaire: {
    experience: 'beginner',
    daysPerWeek: 3,
    sessionMinutes: 45,
    equipment: 'home_dumbbells',
    limitations: 'Lower back pain when lifting heavy',
  },
  goal: 'lose_fat',
  locale: 'pt-BR',
  units: 'metric',
  body: { sex: 'female', ageYears: 29, heightCm: 165, weightKg: 70, activityLevel: 'light' },
  targets: { kcal: 1700, proteinG: 154, carbsG: 150, fatG: 52, formulaVersion: 1 },
}

describe('workout plan prompt v1', () => {
  it('includes every questionnaire answer, the language and the targets', () => {
    const text = workoutPlanPrompt.buildUserText(inputs, null)
    expect(text).toContain('Brazilian Portuguese')
    expect(text).toContain('Experience: beginner')
    expect(text).toContain('Training days per week: 3')
    expect(text).toContain('Session length: 45 minutes')
    expect(text).toContain('adjustable dumbbells')
    expect(text).toContain('Lower back pain')
    expect(text).toContain('1700 kcal')
    expect(text).not.toContain('Body analysis')
  })

  it('adds the body analysis only when it is usable', () => {
    const analysis = buildMockBodyAnalysis(inputs)
    expect(workoutPlanPrompt.buildUserText(inputs, analysis)).toContain('Priority areas: shoulders')
    expect(workoutPlanPrompt.buildUserText(inputs, { ...analysis, usable: false })).not.toContain(
      'Priority areas',
    )
  })

  it('reports missing limitations explicitly', () => {
    const text = workoutPlanPrompt.buildUserText(
      { ...inputs, questionnaire: { ...inputs.questionnaire, limitations: '  ' } },
      null,
    )
    expect(text).toContain('none reported')
  })
})

describe('body analysis prompt v1', () => {
  it('lists the provided views and known stats', () => {
    const text = bodyAnalysisPrompt.buildUserText(inputs, ['front', 'back'])
    expect(text).toContain('Photos provided, in order: front, back.')
    expect(text).toContain('female, 29 years, 165 cm, 70 kg')
  })

  it('has stable versions', () => {
    expect(bodyAnalysisPrompt.version).toBe('body-analysis@1')
    expect(workoutPlanPrompt.version).toBe('workout-plan@1')
  })
})

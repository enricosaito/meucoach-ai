import { describe, expect, it } from 'vitest'
import type { DietInputs } from '../types'
import { dietPlanPrompt } from './index'

const inputs: DietInputs = {
  questionnaire: {
    mealsPerDay: 5,
    dietStyle: 'vegetarian',
    budget: 'economic',
    cookingTime: 'minimal',
    allergies: 'Amendoim',
    dislikes: 'Beterraba',
  },
  goal: 'lose_fat',
  locale: 'pt-BR',
  units: 'metric',
  body: { sex: 'female', ageYears: 29, heightCm: 165, weightKg: 70 },
  targets: { kcal: 1700, proteinG: 132, carbsG: 170, fatG: 52, formulaVersion: 1 },
}

describe('diet plan prompt v1', () => {
  it('has a version', () => {
    expect(dietPlanPrompt.version).toBe('diet-plan@1')
  })

  it('includes the targets, every answer and the language', () => {
    const text = dietPlanPrompt.buildUserText(inputs)
    expect(text).toContain('Brazilian Portuguese')
    expect(text).toContain('Calories: 1700 kcal')
    expect(text).toContain('Protein: 132 g')
    expect(text).toContain('vegetarian')
    expect(text).toContain('Allergies / intolerances: Amendoim')
    expect(text).toContain('Dislikes: Beterraba')
    expect(text).toContain('cheap staples')
    expect(text).toContain('little or no cooking')
  })

  it('lists the meals in order with their calorie share', () => {
    const text = dietPlanPrompt.buildUserText(inputs)
    expect(text).toContain('# Meals (5)')
    expect(text).toContain('breakfast (~340 kcal')
    expect(text.indexOf('breakfast')).toBeLessThan(text.indexOf('dinner'))
  })

  it('says when there are no allergies', () => {
    const { allergies: _a, dislikes: _d, ...rest } = inputs.questionnaire
    const text = dietPlanPrompt.buildUserText({ ...inputs, questionnaire: rest, locale: 'en' })
    expect(text).toContain('Allergies / intolerances: none reported')
    expect(text).toContain('Write all text in English')
  })
})

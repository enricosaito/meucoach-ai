import { describe, expect, it } from 'vitest'
import {
  ACTIVITY_LEVELS,
  ACTIVITY_MULTIPLIERS,
  estimateEnergyExpenditure,
  mifflinStJeorBmr,
} from './mifflin-st-jeor'

describe('mifflinStJeorBmr', () => {
  it('matches the published formula for a male', () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5
    expect(mifflinStJeorBmr({ sex: 'male', ageYears: 30, heightCm: 180, weightKg: 80 })).toBe(1780)
  })

  it('matches the published formula for a female', () => {
    // 10*60 + 6.25*165 - 5*25 - 161 = 600 + 1031.25 - 125 - 161
    expect(mifflinStJeorBmr({ sex: 'female', ageYears: 25, heightCm: 165, weightKg: 60 })).toBe(
      1345.25,
    )
  })

  it('differs by exactly 166 kcal between sexes with identical measurements', () => {
    const base = { ageYears: 40, heightCm: 170, weightKg: 70 }
    expect(
      mifflinStJeorBmr({ ...base, sex: 'male' }) - mifflinStJeorBmr({ ...base, sex: 'female' }),
    ).toBe(166)
  })

  it('decreases by 5 kcal per year of age', () => {
    const base = { sex: 'male' as const, heightCm: 175, weightKg: 75 }
    expect(
      mifflinStJeorBmr({ ...base, ageYears: 30 }) - mifflinStJeorBmr({ ...base, ageYears: 31 }),
    ).toBe(5)
  })
})

describe('estimateEnergyExpenditure', () => {
  it('rounds BMR and derives TDEE from the unrounded BMR', () => {
    const result = estimateEnergyExpenditure({
      sex: 'female',
      ageYears: 25,
      heightCm: 165,
      weightKg: 60,
      activityLevel: 'moderate',
    })
    expect(result.bmrKcal).toBe(1345)
    // 1345.25 * 1.55 = 2085.1375
    expect(result.tdeeKcal).toBe(2085)
    expect(result.formulaVersion).toBe(1)
  })

  it.each(ACTIVITY_LEVELS)('applies the %s multiplier', (activityLevel) => {
    const result = estimateEnergyExpenditure({
      sex: 'male',
      ageYears: 30,
      heightCm: 180,
      weightKg: 80,
      activityLevel,
    })
    expect(result.tdeeKcal).toBe(Math.round(1780 * ACTIVITY_MULTIPLIERS[activityLevel]))
  })

  it('orders activity levels from lowest to highest expenditure', () => {
    const tdees = ACTIVITY_LEVELS.map(
      (activityLevel) =>
        estimateEnergyExpenditure({
          sex: 'male',
          ageYears: 30,
          heightCm: 180,
          weightKg: 80,
          activityLevel,
        }).tdeeKcal,
    )
    expect(tdees).toEqual([...tdees].sort((a, b) => a - b))
  })
})

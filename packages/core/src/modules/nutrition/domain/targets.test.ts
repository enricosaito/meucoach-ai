import { describe, expect, it } from 'vitest'
import { computeDailyTargets, referenceWeightKg, type TargetsInput } from './targets'

const base: TargetsInput = {
  goal: 'maintain',
  sex: 'male',
  weightKg: 80,
  heightCm: 180,
  bmrKcal: 1780,
  tdeeKcal: 2759,
}

describe('computeDailyTargets', () => {
  it('keeps maintenance calories for maintain, rounded to 10 kcal', () => {
    expect(computeDailyTargets(base)).toEqual({
      kcal: 2760,
      proteinG: 144, // 80 kg × 1.8
      fatG: 77, // 25% of 2760 / 9 = 76.7
      carbsG: 373, // (2760 − 576 − 693) / 4 = 372.75
      formulaVersion: 1,
    })
  })

  it('applies a 20% deficit for fat loss and higher protein', () => {
    const t = computeDailyTargets({ ...base, goal: 'lose_fat' })
    expect(t.kcal).toBe(2210) // 2759 × 0.8 = 2207.2
    expect(t.proteinG).toBe(176) // 80 × 2.2
  })

  it('applies a 10% surplus for muscle gain', () => {
    const t = computeDailyTargets({ ...base, goal: 'build_muscle' })
    expect(t.kcal).toBe(3030) // 2759 × 1.1 = 3034.9
    expect(t.proteinG).toBe(160)
  })

  it('treats an unset goal as maintain', () => {
    expect(computeDailyTargets({ ...base, goal: undefined })).toEqual(computeDailyTargets(base))
  })

  it('never puts a deficit below BMR', () => {
    const t = computeDailyTargets({ ...base, goal: 'lose_fat', bmrKcal: 2300 })
    expect(t.kcal).toBe(2300)
  })

  it('never puts a deficit below the sex-specific floor', () => {
    const t = computeDailyTargets({
      goal: 'lose_fat',
      sex: 'female',
      weightKg: 45,
      heightCm: 150,
      bmrKcal: 1050,
      tdeeKcal: 1400,
    })
    expect(t.kcal).toBe(1200)
  })

  it('does not lower calories for a surplus goal even if below the floor', () => {
    const t = computeDailyTargets({ ...base, goal: 'build_muscle', tdeeKcal: 1000, bmrKcal: 900 })
    expect(t.kcal).toBe(1100)
  })

  it('caps protein for very high body weights at a BMI of 27', () => {
    const heavy = computeDailyTargets({ ...base, weightKg: 150, goal: 'lose_fat' })
    // 27 × 1.8² = 87.48 kg → 87.48 × 2.2 = 192.5
    expect(heavy.proteinG).toBe(192)
  })

  it('macro calories add up to the calorie target (within rounding)', () => {
    for (const goal of ['lose_fat', 'maintain', 'build_muscle', 'improve_health'] as const) {
      const t = computeDailyTargets({ ...base, goal })
      const macroKcal = t.proteinG * 4 + t.carbsG * 4 + t.fatG * 9
      expect(Math.abs(macroKcal - t.kcal)).toBeLessThanOrEqual(6)
    }
  })

  it('never returns negative carbs', () => {
    const t = computeDailyTargets({
      ...base,
      weightKg: 300,
      heightCm: 250,
      tdeeKcal: 1600,
      bmrKcal: 1500,
    })
    expect(t.carbsG).toBeGreaterThanOrEqual(0)
  })
})

describe('referenceWeightKg', () => {
  it('uses actual weight below the cap', () => {
    expect(referenceWeightKg(70, 175)).toBe(70)
  })

  it('caps at BMI 27', () => {
    expect(referenceWeightKg(120, 170)).toBeCloseTo(78.03, 2)
  })
})

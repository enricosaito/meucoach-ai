import { describe, expect, it } from 'vitest'
import { assessmentInputSchema, updateProfileSchema } from './schemas'

const validAssessment = {
  sex: 'female',
  ageYears: 32,
  heightCm: 168.5,
  weightKg: 64.2,
  activityLevel: 'light',
}

describe('assessmentInputSchema', () => {
  it('accepts a valid metric input', () => {
    expect(assessmentInputSchema.parse(validAssessment)).toEqual(validAssessment)
  })

  it.each([
    ['age below range', { ageYears: 14 }],
    ['age above range', { ageYears: 101 }],
    ['fractional age', { ageYears: 30.5 }],
    ['height below range', { heightCm: 99 }],
    ['weight above range', { weightKg: 351 }],
    ['unknown sex', { sex: 'other' }],
    ['unknown activity level', { activityLevel: 'extreme' }],
    ['string number', { weightKg: '64' }],
  ])('rejects %s', (_label, override) => {
    expect(assessmentInputSchema.safeParse({ ...validAssessment, ...override }).success).toBe(false)
  })

  it('rejects unknown keys (e.g. a client-supplied userId)', () => {
    expect(
      assessmentInputSchema.safeParse({ ...validAssessment, userId: 'someone-else' }).success,
    ).toBe(false)
  })
})

describe('updateProfileSchema', () => {
  it('accepts a partial update and trims the display name', () => {
    expect(updateProfileSchema.parse({ displayName: '  Ana  ' })).toEqual({ displayName: 'Ana' })
  })

  it('accepts valid IANA time zones', () => {
    expect(updateProfileSchema.safeParse({ timezone: 'America/Sao_Paulo' }).success).toBe(true)
  })

  it('rejects invalid time zones', () => {
    expect(updateProfileSchema.safeParse({ timezone: 'Mars/Olympus' }).success).toBe(false)
  })

  it('rejects an empty update', () => {
    expect(updateProfileSchema.safeParse({}).success).toBe(false)
  })

  it('rejects unknown goal keys', () => {
    expect(updateProfileSchema.safeParse({ goals: { primary: 'maintain', x: 1 } }).success).toBe(
      false,
    )
  })
})

describe('username', () => {
  it('normalises to lowercase and trims', () => {
    expect(updateProfileSchema.parse({ username: '  Ana.Souza_1 ' })).toEqual({
      username: 'ana.souza_1',
    })
  })

  it.each(['ab', 'a'.repeat(21), 'ana souza', 'ana-souza', 'anã'])('rejects "%s"', (username) => {
    expect(updateProfileSchema.safeParse({ username }).success).toBe(false)
  })

  it('caps display names at 40 characters', () => {
    expect(updateProfileSchema.safeParse({ displayName: 'x'.repeat(41) }).success).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'
import { cmToFeetInches, feetInchesToCm, kgToPounds, poundsToKg } from './units'

describe('unit conversion', () => {
  it('converts pounds to kilograms with one decimal', () => {
    expect(poundsToKg(176)).toBe(79.8)
    expect(poundsToKg(0)).toBe(0)
  })

  it('converts feet and inches to centimetres with one decimal', () => {
    expect(feetInchesToCm(5, 11)).toBe(180.3)
    expect(feetInchesToCm(6, 0)).toBe(182.9)
  })
})

describe('reverse unit conversion', () => {
  it('converts kilograms to pounds with one decimal', () => {
    expect(kgToPounds(79.8)).toBe(175.9)
    expect(kgToPounds(0)).toBe(0)
  })

  it('splits centimetres into feet and inches', () => {
    expect(cmToFeetInches(180.3)).toEqual({ feet: 5, inches: 11 })
    expect(cmToFeetInches(182.9)).toEqual({ feet: 6, inches: 0 })
  })

  it('round-trips feet/inches through centimetres', () => {
    for (const [feet, inches] of [
      [4, 11],
      [5, 6],
      [6, 3],
    ] as const) {
      expect(cmToFeetInches(feetInchesToCm(feet, inches))).toEqual({ feet, inches })
    }
  })
})

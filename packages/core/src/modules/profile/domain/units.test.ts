import { describe, expect, it } from 'vitest'
import { feetInchesToCm, poundsToKg } from './units'

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

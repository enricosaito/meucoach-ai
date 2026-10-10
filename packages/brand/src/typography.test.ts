import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { fontFamilies, fontFamilyFor, typeScale } from './typography'

describe('fonts', () => {
  it.each(Object.values(fontFamilies).flatMap((faces) => Object.values(faces)))(
    '%s is bundled in the mobile app',
    (family) => {
      const file = new URL(`../../../apps/mobile/assets/fonts/${family}.ttf`, import.meta.url)
      expect(existsSync(file)).toBe(true)
    },
  )

  it('picks the nearest bundled weight', () => {
    expect(fontFamilyFor('ui', 600)).toBe('Manrope-SemiBold')
    expect(fontFamilyFor('ui', 800)).toBe('Manrope-Bold')
    expect(fontFamilyFor('display', 400)).toBe('ArchivoExpanded-Bold')
    expect(fontFamilyFor('display', 900)).toBe('ArchivoExpanded-Black')
  })

  it('every type style resolves to a bundled face', () => {
    for (const [name, style] of Object.entries(typeScale)) {
      const faces: Record<number, string> = fontFamilies[style.role]
      expect(faces[style.weight], name).toBeDefined()
      expect(style.lineHeight, name).toBeGreaterThanOrEqual(style.size)
    }
  })
})

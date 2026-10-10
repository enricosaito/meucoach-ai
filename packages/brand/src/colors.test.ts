import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { dark, light, plateForLevel, plates, type ColorTokens } from './colors'
import { contrastRatio } from './contrast'

const AA_TEXT = 4.5
const AA_GRAPHIC = 3

const themes = { light, dark } as const

function surfaces(c: ColorTokens) {
  return {
    background: c.background,
    surface: c.surface,
    elevated: c.surfaceElevated,
    muted: c.surfaceMuted,
  }
}

// Every token used for text, and the backgrounds it may sit on (all surfaces + its own tint).
const TEXT_ON: [keyof ColorTokens, (keyof ColorTokens)[]][] = [
  ['textPrimary', ['accentSoft', 'recoverySoft', 'controlSelected']],
  ['textSecondary', ['accentSoft', 'recoverySoft']],
  ['accentText', ['accentSoft']],
  ['recoveryText', ['recoverySoft']],
  ['success', ['successSoft']],
  ['warning', ['warningSoft']],
  ['error', ['errorSoft']],
]

// Icons, rings and chart marks: 3:1 against any surface.
const GRAPHICS: (keyof ColorTokens)[] = [
  'accentIcon',
  'recoveryText',
  'macroProtein',
  'macroCarbs',
  'macroFat',
]

describe.each(Object.entries(themes))('%s theme', (_name, c) => {
  it.each(TEXT_ON)('%s is readable (AA) on every surface', (token, extra) => {
    const bgs = { ...surfaces(c), ...Object.fromEntries(extra.map((k) => [k, c[k]])) }
    for (const [bg, value] of Object.entries(bgs)) {
      expect(contrastRatio(c[token], value), `${token} on ${bg}`).toBeGreaterThanOrEqual(AA_TEXT)
    }
  })

  it.each(GRAPHICS)('%s is visible (3:1) on every surface', (token) => {
    for (const [bg, value] of Object.entries(surfaces(c))) {
      expect(contrastRatio(c[token], value), `${token} on ${bg}`).toBeGreaterThanOrEqual(AA_GRAPHIC)
    }
  })

  it('text on orange buttons is readable, pressed included', () => {
    expect(contrastRatio(c.onAccent, c.accent)).toBeGreaterThanOrEqual(AA_TEXT)
    expect(contrastRatio(c.onAccent, c.accentPressed)).toBeGreaterThanOrEqual(AA_TEXT)
  })
})

describe('accent orange', () => {
  it('is too light for small text on chalk (why accentText exists)', () => {
    expect(contrastRatio(light.accent, light.background)).toBeLessThan(AA_TEXT)
  })
  it('needs graphite, not white, text on top', () => {
    expect(contrastRatio('#FFFFFF', light.accent)).toBeLessThan(AA_TEXT)
  })
})

describe('plates', () => {
  it.each(Object.entries(plates))('%s has readable text on it', (_kg, plate) => {
    expect(contrastRatio(plate.on, plate.color)).toBeGreaterThanOrEqual(AA_TEXT)
  })
})

// The web app can't import TypeScript into CSS, so globals.css repeats the values. Keep in sync.
describe('web globals.css mirrors the tokens', () => {
  const css = readFileSync(
    new URL('../../../apps/web/src/app/globals.css', import.meta.url),
    'utf8',
  )
  const lightBlock = css.slice(css.indexOf(':root {'), css.indexOf('@media (prefers-color-scheme'))
  const darkBlock = css.slice(css.indexOf('@media (prefers-color-scheme'), css.indexOf('@theme'))
  const WEB_VARS: Record<string, keyof ColorTokens> = {
    '--bg': 'background',
    '--surface': 'surface',
    '--surface-2': 'surfaceMuted',
    '--raised': 'surfaceElevated',
    '--fg': 'textPrimary',
    '--muted': 'textSecondary',
    '--line': 'border',
    '--accent': 'accent',
    '--accent-strong': 'accentPressed',
    '--accent-text': 'accentText',
    '--accent-fg': 'onAccent',
    '--accent-soft': 'accentSoft',
    '--energy': 'accentText',
    '--energy-soft': 'accentSoft',
    '--fat': 'macroFat',
    '--danger': 'error',
    '--danger-soft': 'errorSoft',
  }
  const read = (block: string, name: string) =>
    new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`).exec(block)?.[1]?.toUpperCase()

  it.each(Object.entries(WEB_VARS))('%s', (name, token) => {
    expect(read(lightBlock, name), `light ${name}`).toBe(light[token].toUpperCase())
    expect(read(darkBlock, name), `dark ${name}`).toBe(dark[token].toUpperCase())
  })
})

describe('plateForLevel', () => {
  it('gets heavier as the level goes up', () => {
    expect([1, 2, 3, 5, 7, 10, 40].map(plateForLevel)).toEqual([
      'kg5',
      'kg5',
      'kg10',
      'kg15',
      'kg20',
      'kg25',
      'kg25',
    ])
  })
})

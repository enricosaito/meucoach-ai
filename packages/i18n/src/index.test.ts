import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createTranslator,
  DEFAULT_LOCALE,
  isLocale,
  LOCALES,
  pluralCategory,
  resolveLocale,
} from './index'
import { en } from './messages/en'
import { ptBR } from './messages/pt-BR'

function keysOf(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) =>
    typeof value === 'string' ? [`${prefix}${key}`] : keysOf(value as object, `${prefix}${key}.`),
  )
}

function placeholders(text: string): string[] {
  return [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1] ?? '').sort()
}

describe('catalogs', () => {
  it('pt-BR has exactly the same keys as en', () => {
    expect(keysOf(ptBR).sort()).toEqual(keysOf(en).sort())
  })

  it('translations keep the same placeholders as the source', () => {
    const pt = createTranslator('pt-BR')
    const source = createTranslator('en')
    for (const key of keysOf(en)) {
      const k = key as Parameters<typeof pt.t>[0]
      expect(placeholders(pt.t(k)), key).toEqual(placeholders(source.t(k)))
    }
  })

  it('has no empty strings', () => {
    for (const locale of ['en', 'pt-BR'] as const) {
      const { t } = createTranslator(locale)
      for (const key of keysOf(en)) {
        expect(t(key as Parameters<typeof t>[0]).trim(), `${locale}:${key}`).not.toBe('')
      }
    }
  })
})

describe('createTranslator', () => {
  it('translates nested keys and interpolates params', () => {
    const t = createTranslator('pt-BR').t
    expect(t('goals.lose_fat.label')).toBe('Perder gordura')
    expect(t('home.maintenanceLine', { activity: 'ativo' })).toBe('Manutenção · ativo')
    expect(createTranslator('en').t('common.grams', { value: 120 })).toBe('120 g')
  })

  it('formats numbers per locale', () => {
    expect(createTranslator('pt-BR').formatNumber(2740)).toBe('2.740')
    expect(createTranslator('en').formatNumber(2740)).toBe('2,740')
  })
})

describe('resolveLocale', () => {
  it('reads Accept-Language with quality values', () => {
    expect(resolveLocale('en-US,en;q=0.9,pt-BR;q=0.8')).toBe('en')
    expect(resolveLocale('fr-FR,pt;q=0.9,en;q=0.8')).toBe('pt-BR')
  })

  it('maps any Portuguese or English variant', () => {
    expect(resolveLocale('pt-PT')).toBe('pt-BR')
    expect(resolveLocale('en-GB')).toBe('en')
  })

  it('uses the first candidate that resolves, then the default', () => {
    expect(resolveLocale(undefined, 'de-DE', 'en')).toBe('en')
    expect(resolveLocale(null, 'de-DE')).toBe(DEFAULT_LOCALE)
  })

  it('validates locales', () => {
    expect(isLocale('pt-BR')).toBe(true)
    expect(isLocale('pt')).toBe(false)
  })
})

describe('plurals', () => {
  it('picks one/other by count and formats the number', () => {
    expect(createTranslator('pt-BR').tc('streak.daysInARow', 1)).toBe('dia seguido')
    expect(createTranslator('pt-BR').tc('streak.daysInARow', 5)).toBe('dias seguidos')
    expect(createTranslator('en').tc('streak.daysInARow', 1)).toBe('day in a row')
    expect(createTranslator('en').tc('streak.daysInARow', 2)).toBe('days in a row')
  })
})

/** Like Hermes on iOS: the rest of Intl works, PluralRules doesn't exist. */
function withoutPluralRules() {
  vi.stubGlobal(
    'Intl',
    Object.assign(Object.create(Intl) as typeof Intl, { PluralRules: undefined }),
  )
}

describe('plurals without Intl.PluralRules (Hermes on iOS)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const SAMPLES = [0, 1, 1.5, 2, 5, 10, 21, 100, 1000]

  it('the fallback matches Intl.PluralRules for every locale', () => {
    const real = Object.fromEntries(LOCALES.map((l) => [l, SAMPLES.map(pluralCategory(l))]))
    withoutPluralRules()
    for (const locale of LOCALES) {
      expect(SAMPLES.map(pluralCategory(locale))).toEqual(real[locale])
    }
  })

  it('createTranslator works and pluralises', () => {
    withoutPluralRules()
    const pt = createTranslator('pt-BR')
    expect(pt.tc('home.streakDays', 1)).toBe('1 dia')
    expect(pt.tc('home.streakDays', 3)).toBe('3 dias')
    expect(createTranslator('en').tc('home.streakDays', 1)).toBe('1 day')
  })
})

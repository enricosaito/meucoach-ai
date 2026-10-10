import { en, type Messages } from './messages/en'
import { ptBR } from './messages/pt-BR'

export type { Messages }

export const LOCALES = ['pt-BR', 'en'] as const
export type Locale = (typeof LOCALES)[number]

/** Primary market is Brazil. */
export const DEFAULT_LOCALE: Locale = 'pt-BR'

export const LOCALE_COOKIE = 'locale'

const CATALOGS: Record<Locale, Messages> = { en, 'pt-BR': ptBR }

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

/**
 * Picks the best supported locale from candidates such as a saved preference, an
 * `Accept-Language` header ("pt-BR,pt;q=0.9,en;q=0.8") or device locales ("pt-PT", "en-US").
 * Any Portuguese variant maps to pt-BR, any English variant to en.
 */
export function resolveLocale(...candidates: (string | null | undefined)[]): Locale {
  for (const candidate of candidates) {
    if (!candidate) continue
    const tags = candidate
      .split(',')
      .map((part) => {
        const [tag = '', q] = part.trim().split(';q=')
        return { tag: tag.toLowerCase(), q: q ? Number(q) : 1 }
      })
      .filter((entry) => entry.tag && !Number.isNaN(entry.q))
      .sort((a, b) => b.q - a.q)
    for (const { tag } of tags) {
      if (tag.startsWith('pt')) return 'pt-BR'
      if (tag.startsWith('en')) return 'en'
    }
  }
  return DEFAULT_LOCALE
}

// Dot-separated paths to every string in the catalog, e.g. "goals.lose_fat.label".
type Leaves<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${Prefix}${K}` : Leaves<T[K], `${Prefix}${K}.`>
}[keyof T & string]

export type MessageKey = Leaves<Messages>

// Paths to objects shaped { one, other }: pluralised messages, e.g. "streak.daysInARow".
type PluralPaths<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends { one: string; other: string }
    ? `${Prefix}${K}`
    : T[K] extends string
      ? never
      : PluralPaths<T[K], `${Prefix}${K}.`>
}[keyof T & string]

export type PluralKey = PluralPaths<Messages>
export type MessageParams = Record<string, string | number>
export type Translate = (key: MessageKey, params?: MessageParams) => string

function lookup(messages: Messages, key: string): string | undefined {
  let node: unknown = messages
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined
    node = (node as Record<string, unknown>)[part]
  }
  return typeof node === 'string' ? node : undefined
}

function interpolate(template: string, params?: MessageParams): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  )
}

export interface Translator {
  locale: Locale
  t: Translate
  /** Plural-aware translation: picks `one` or `other` for `count` (CLDR rules). `{count}` is interpolated. */
  tc: (key: PluralKey, count: number, params?: MessageParams) => string
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string
  formatDate: (value: string | Date, options?: Intl.DateTimeFormatOptions) => string
}

type PluralCategory = 'one' | 'other'

/**
 * CLDR cardinal rules for our locales, for runtimes without Intl.PluralRules (Hermes on iOS).
 * en: "one" for exactly 1. pt: "one" when the integer part is 0 or 1 (0, 1, 1.5).
 */
const FALLBACK_PLURALS: Record<Locale, (n: number) => PluralCategory> = {
  en: (n) => (n === 1 ? 'one' : 'other'),
  'pt-BR': (n) => (Math.trunc(Math.abs(n)) <= 1 ? 'one' : 'other'),
}

export function pluralCategory(locale: Locale): (n: number) => PluralCategory {
  if (typeof Intl.PluralRules !== 'function') return FALLBACK_PLURALS[locale]
  const rules = new Intl.PluralRules(locale)
  return (n) => (rules.select(n) === 'one' ? 'one' : 'other')
}

/** Pure, framework-agnostic translator. Usable on the server, in the browser and in React Native. */
export function createTranslator(locale: Locale): Translator {
  const messages = CATALOGS[locale]
  const numberFormat = new Intl.NumberFormat(locale)
  const plural = pluralCategory(locale)
  return {
    locale,
    t: (key, params) => interpolate(lookup(messages, key) ?? lookup(en, key) ?? key, params),
    tc: (key, count, params) => {
      const category = plural(count)
      const path = `${key}.${category}`
      return interpolate(lookup(messages, path) ?? lookup(en, path) ?? key, {
        count: numberFormat.format(count),
        ...params,
      })
    },
    formatNumber: (value, options) =>
      options ? new Intl.NumberFormat(locale, options).format(value) : numberFormat.format(value),
    formatDate: (value, options = { day: 'numeric', month: 'short', year: 'numeric' }) =>
      new Date(value).toLocaleDateString(locale, options),
  }
}

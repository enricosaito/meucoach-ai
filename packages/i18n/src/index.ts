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
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string
  formatDate: (value: string | Date, options?: Intl.DateTimeFormatOptions) => string
}

/** Pure, framework-agnostic translator. Usable on the server, in the browser and in React Native. */
export function createTranslator(locale: Locale): Translator {
  const messages = CATALOGS[locale]
  const numberFormat = new Intl.NumberFormat(locale)
  return {
    locale,
    t: (key, params) => interpolate(lookup(messages, key) ?? lookup(en, key) ?? key, params),
    formatNumber: (value, options) =>
      options ? new Intl.NumberFormat(locale, options).format(value) : numberFormat.format(value),
    formatDate: (value, options = { day: 'numeric', month: 'short', year: 'numeric' }) =>
      new Date(value).toLocaleDateString(locale, options),
  }
}

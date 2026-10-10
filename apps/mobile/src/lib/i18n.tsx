import {
  createTranslator,
  DEFAULT_LOCALE,
  type Locale,
  type MessageKey,
  type Translator,
} from '@mycoach/i18n'
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { ApiError } from './api'

interface I18nState extends Translator {
  setLocale: (locale: Locale) => void
}

const I18nContext = createContext<I18nState | null>(null)

/** Same translator as the web app. The profile's language is applied once /me loads. */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE)
  const value = useMemo(() => ({ ...createTranslator(locale), setLocale }), [locale])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nState {
  const value = useContext(I18nContext)
  if (!value) throw new Error('useI18n must be used inside <I18nProvider>')
  return value
}

const KNOWN_ERROR_CODES = new Set([
  'rate_limited',
  'ai_unavailable',
  'validation_failed',
  'unauthorized',
  'idempotency_in_progress',
  'username_taken',
  'energy_test_required',
])

/** A user-facing message for any error: API error codes are translated, the rest is generic. */
export function errorMessage(t: Translator['t'], error: unknown): string {
  if (error instanceof ApiError && KNOWN_ERROR_CODES.has(error.code)) {
    return t(`errors.${error.code}` as MessageKey)
  }
  if (error instanceof TypeError) return t('errors.network')
  return t('errors.generic')
}

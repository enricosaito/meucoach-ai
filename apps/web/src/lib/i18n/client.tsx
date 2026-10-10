'use client'

import {
  createTranslator,
  LOCALE_COOKIE,
  type Locale,
  type MessageKey,
  type Translator,
} from '@mycoach/i18n'
import { useRouter } from 'next/navigation'
import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { ApiError } from '../api'

interface I18nValue extends Translator {
  /** Persists the UI language for this browser and re-renders server components. */
  setLocale: (locale: Locale) => void
}

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const router = useRouter()
  const setLocale = useCallback(
    (next: Locale) => {
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
      document.documentElement.lang = next
      router.refresh()
    },
    [router],
  )
  const value = useMemo(() => ({ ...createTranslator(locale), setLocale }), [locale, setLocale])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
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

/** A user-facing, translated message for any error thrown by the API client. */
export function errorMessage(t: Translator['t'], error: unknown): string {
  if (error instanceof ApiError && KNOWN_ERROR_CODES.has(error.code)) {
    return t(`errors.${error.code}` as MessageKey)
  }
  if (error instanceof TypeError) return t('errors.network')
  return t('errors.generic')
}

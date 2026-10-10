'use client'

import { useI18n } from '@/lib/i18n/client'
import { LOCALES } from '@mycoach/i18n'
import { Languages } from 'lucide-react'
import { cx } from './ui'

/** Compact language toggle for signed-out screens. Signed-in users change it in their profile. */
export function LanguageSwitch({ className }: { className?: string }) {
  const { t, locale, setLocale } = useI18n()
  return (
    <div
      role="group"
      aria-label={t('language.label')}
      className={cx(
        'inline-flex items-center gap-1 rounded-full bg-surface-2 p-1 text-sm',
        className,
      )}
    >
      <Languages className="mx-1.5 size-4 text-muted" aria-hidden />
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={l === locale}
          onClick={() => {
            setLocale(l)
          }}
          className={cx(
            'rounded-full px-3 py-1 font-medium transition-colors',
            l === locale ? 'bg-raised text-fg shadow-card' : 'text-muted hover:text-fg',
          )}
        >
          {l === 'pt-BR' ? 'PT' : 'EN'}
        </button>
      ))}
    </div>
  )
}

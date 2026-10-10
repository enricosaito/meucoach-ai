'use client'

import { useI18n } from '@/lib/i18n/client'
import type { DailyTargets } from '@mycoach/core/nutrition/contracts'
import type { Goals } from '@mycoach/core/profile/contracts'
import { Target } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { Card } from './ui'

const MACROS = [
  { key: 'proteinG', label: 'targets.protein', kcalPerGram: 4, color: 'bg-accent' },
  { key: 'carbsG', label: 'targets.carbs', kcalPerGram: 4, color: 'bg-energy' },
  { key: 'fatG', label: 'targets.fat', kcalPerGram: 9, color: 'bg-fat' },
] as const

export function TargetsCard({
  targets,
  goal,
  footer,
}: {
  targets: DailyTargets
  goal: Goals['primary']
  footer?: ReactNode
}) {
  const { t, formatNumber } = useI18n()
  const shares = MACROS.map((m) => (targets[m.key] * m.kcalPerGram) / targets.kcal)

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <p className="inline-flex items-center gap-1.5 text-sm font-medium text-muted">
          <Target className="size-4 text-accent" aria-hidden />
          {t('targets.title')}
        </p>
        {footer}
      </div>

      <p className="mt-3 flex items-baseline gap-2">
        <span className="text-5xl font-semibold tracking-tight tabular-nums">
          {formatNumber(targets.kcal)}
        </span>
        <span className="text-[15px] text-muted">{t('common.kcalPerDay')}</span>
      </p>

      {/* Calorie split by macro. */}
      <div className="mt-4 flex h-2 gap-1 overflow-hidden rounded-full" aria-hidden>
        {MACROS.map((m, i) => (
          <span
            key={m.key}
            className={`${m.color} rounded-full`}
            style={{ width: `${((shares[i] ?? 0) * 100).toFixed(1)}%` }}
          />
        ))}
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-3">
        {MACROS.map((m, i) => (
          <div key={m.key}>
            <dt className="flex items-center gap-1.5 text-sm text-muted">
              <span className={`size-2 rounded-full ${m.color}`} aria-hidden />
              {t(m.label)}
            </dt>
            <dd className="mt-0.5">
              <span className="text-xl font-semibold tabular-nums">
                {t('common.grams', { value: formatNumber(targets[m.key]) })}
              </span>
              <span className="ml-1 text-xs text-muted tabular-nums">
                {formatNumber(shares[i] ?? 0, { style: 'percent', maximumFractionDigits: 0 })}
              </span>
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 border-t border-line pt-3 text-sm text-muted">
        {goal ? (
          t(`targets.why.${goal}`)
        ) : (
          <Link
            href="/app/profile/settings#goal"
            className="font-medium text-accent hover:underline"
          >
            {t('targets.noGoal')}
          </Link>
        )}
      </p>
    </Card>
  )
}

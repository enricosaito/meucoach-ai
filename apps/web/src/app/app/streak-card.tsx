'use client'

import { Card, cx } from '@/components/ui'
import { useI18n } from '@/lib/i18n/client'
import type { Streak } from '@mycoach/core/gamification/contracts'
import { Flame, Trophy } from 'lucide-react'
import { useState } from 'react'

const WEEK = 7

/** Daily login streak: current run, best run and the last 7 days at a glance. */
export function StreakCard({ streak }: { streak: Streak }) {
  const { t, tc, formatNumber, formatDate } = useI18n()
  const { current, longest, activeToday } = streak
  // Captured once per mount: rendering must stay pure.
  const [now] = useState(() => Date.now())

  // Last 7 days, oldest first. A day is lit if it falls inside the current run.
  const runEndsDaysAgo = activeToday ? 0 : 1
  const days = Array.from({ length: WEEK }, (_, i) => {
    const daysAgo = WEEK - 1 - i
    const date = new Date(now - daysAgo * 24 * 60 * 60 * 1000)
    const lit = daysAgo >= runEndsDaysAgo && daysAgo < runEndsDaysAgo + current
    return { daysAgo, lit, label: formatDate(date, { weekday: 'narrow' }) }
  })

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <span
          className={cx(
            'relative grid size-14 shrink-0 place-items-center rounded-2xl',
            current > 0 ? 'bg-energy-soft text-energy' : 'bg-surface-2 text-muted',
          )}
        >
          <Flame className="size-7" aria-hidden fill={current > 1 ? 'currentColor' : 'none'} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-baseline gap-1.5">
            <span className="text-3xl font-semibold tracking-tight tabular-nums">
              {formatNumber(current)}
            </span>
            <span className="text-[15px] font-medium">{tc('streak.daysInARow', current)}</span>
          </p>
          <p className="text-sm text-muted">
            {current > 1 ? t('streak.keepGoing') : t('streak.started')}
          </p>
        </div>
        {longest > 1 && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-muted">
            <Trophy className="size-3.5" aria-hidden />
            {t('streak.best', { count: formatNumber(longest) })}
          </span>
        )}
      </div>

      <ol className="grid grid-cols-7 gap-1.5" aria-hidden>
        {days.map((day) => (
          <li key={day.daysAgo} className="flex flex-col items-center gap-1">
            <span
              className={cx(
                'h-2 w-full rounded-full transition-colors',
                day.lit ? 'bg-energy' : 'bg-surface-2',
              )}
            />
            <span
              className={cx(
                'text-[11px] font-medium uppercase',
                day.daysAgo === 0 ? 'text-fg' : 'text-muted',
              )}
            >
              {day.label}
            </span>
          </li>
        ))}
      </ol>
    </Card>
  )
}

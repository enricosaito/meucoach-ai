'use client'

import { Card } from '@/components/ui'
import { useI18n } from '@/lib/i18n/client'
import type { LevelProgress } from '@mycoach/core/gamification/contracts'
import { Star } from 'lucide-react'

/** Current level and progress to the next one. Levels are derived from the XP ledger. */
export function LevelCard({ level }: { level: LevelProgress }) {
  const { t, tc, formatNumber } = useI18n()
  const percent = level.levelSpan > 0 ? (level.levelXp / level.levelSpan) * 100 : 0
  const remaining = level.levelSpan - level.levelXp

  return (
    <Card className="flex items-center gap-4">
      <span className="relative grid size-14 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent">
        <Star className="size-7" aria-hidden fill="currentColor" />
        <span className="absolute -right-1 -bottom-1 grid min-w-6 place-items-center rounded-full bg-accent px-1.5 text-xs font-semibold text-accent-fg tabular-nums">
          {formatNumber(level.level)}
        </span>
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-lg font-semibold tracking-tight">
            {t('level.title', { level: formatNumber(level.level) })}
          </p>
          <p className="text-sm text-muted tabular-nums">
            {t('level.progress', {
              xp: formatNumber(level.levelXp),
              span: formatNumber(level.levelSpan),
            })}
          </p>
        </div>
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={level.levelSpan}
          aria-valuenow={level.levelXp}
          aria-label={t('level.title', { level: formatNumber(level.level) })}
        >
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-1.5 text-sm text-muted">
          {level.totalXp === 0
            ? t('level.hint')
            : tc('level.toNext', remaining, { level: formatNumber(level.level + 1) })}
        </p>
      </div>
    </Card>
  )
}

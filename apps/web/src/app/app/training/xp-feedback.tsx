'use client'

import { cx } from '@/components/ui'
import { useI18n } from '@/lib/i18n/client'
import type { XpFeedback } from '@/lib/use-workout-log'
import { Sparkles } from 'lucide-react'

/** What logging a workout earned: XP pill plus a short message (level up wins). */
export function XpFeedbackNote({
  feedback,
  className,
}: {
  feedback: XpFeedback | null
  className?: string
}) {
  const { t, formatNumber } = useI18n()
  return (
    <p aria-live="polite" className={cx('min-h-0 text-sm', className)}>
      {feedback && (
        <span
          key={`${feedback.level}-${feedback.awarded}`}
          className="inline-flex animate-rise-in items-center gap-2"
        >
          {feedback.awarded > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 font-semibold text-accent-fg tabular-nums">
              <Sparkles className="size-3.5" aria-hidden />
              {t('workout.xpEarned', { xp: formatNumber(feedback.awarded) })}
            </span>
          )}
          <span>
            {feedback.leveledUp
              ? t('workout.levelUp', { level: formatNumber(feedback.level) })
              : feedback.awarded > 0
                ? t('workout.logged')
                : t('workout.loggedNoXp')}
          </span>
        </span>
      )}
    </p>
  )
}

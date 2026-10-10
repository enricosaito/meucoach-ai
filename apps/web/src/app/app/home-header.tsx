'use client'

import { cx } from '@/components/ui'
import { useI18n } from '@/lib/i18n/client'
import { greetingKey } from '@/lib/labels'
import { firstName } from '@mycoach/core/profile/contracts'
import { Flame, Star, Target } from 'lucide-react'
import Link from 'next/link'
import type { MeWithTargets } from './me-context'
import { GOAL_ICONS } from './profile/settings/profile-settings'

const chip =
  'flex h-10 items-center justify-center gap-1.5 rounded-2xl bg-surface-2 px-2.5 text-sm font-medium whitespace-nowrap transition-colors'

/** Greeting, goal, streak and level in one compact block: the top of Home on a phone. */
export function HomeHeader({ me }: { me: MeWithTargets }) {
  const { t, tc, formatNumber } = useI18n()
  const goal = me.profile.goals.primary
  const GoalIcon = goal ? GOAL_ICONS[goal] : Target
  const { current } = me.streak
  const { level, levelXp, levelSpan } = me.level
  const progress = levelSpan > 0 ? Math.min(1, levelXp / levelSpan) : 0

  return (
    <header className="flex flex-col gap-3">
      {/* Right padding leaves room for the floating avatar on phones (see AppShell). */}
      <div className="pr-14 sm:pr-0">
        <p className="text-[15px] text-muted">{t(greetingKey())},</p>
        <h1 className="text-3xl font-semibold tracking-tight">{firstName(me.profile)}</h1>
      </div>

      {/* One row on any phone: streak and level fit their content, the goal takes the rest. */}
      <div className="flex gap-2">
        <Link
          href="/app/profile/settings#goal"
          className={cx(chip, 'min-w-0 flex-1 hover:bg-line sm:flex-none')}
          aria-label={`${t('profile.goal')}: ${goal ? t(`goals.${goal}.label`) : t('goals.setGoal')}`}
        >
          <GoalIcon className="size-4 shrink-0 text-accent-text" aria-hidden />
          <span className="truncate">{goal ? t(`goals.${goal}.label`) : t('goals.setGoal')}</span>
        </Link>

        <span
          className={cx(chip, 'shrink-0')}
          aria-label={`${t('profile.streak')}: ${formatNumber(current)} ${tc('streak.daysInARow', current)}`}
        >
          <Flame
            className={cx('size-4 shrink-0', current > 0 ? 'text-energy' : 'text-muted')}
            fill={current > 1 ? 'currentColor' : 'none'}
            aria-hidden
          />
          <span className="tabular-nums" aria-hidden>
            {tc('home.streakDays', current)}
          </span>
        </span>

        <Link
          href="/app/profile"
          className={cx(chip, 'shrink-0 hover:bg-line')}
          aria-label={`${t('level.title', { level: formatNumber(level) })}, ${formatNumber(levelXp)} / ${formatNumber(levelSpan)} XP`}
        >
          <Star className="size-4 shrink-0 text-accent-text" fill="currentColor" aria-hidden />
          <span className="tabular-nums" aria-hidden>
            {formatNumber(level)}
          </span>
          <span className="h-1.5 w-6 shrink-0 overflow-hidden rounded-full bg-line" aria-hidden>
            <span
              className="block h-full rounded-full bg-accent transition-[width] duration-500"
              style={{ width: `${(progress * 100).toFixed(1)}%` }}
            />
          </span>
        </Link>
      </div>
    </header>
  )
}

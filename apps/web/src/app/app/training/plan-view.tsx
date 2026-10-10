'use client'

import { Card, cx } from '@/components/ui'
import { useI18n } from '@/lib/i18n/client'
import type { WorkoutPlan } from '@mycoach/core/training/contracts'
import { CalendarDays, Clock, Flame, Lightbulb, Snowflake, TrendingUp } from 'lucide-react'
import { useState } from 'react'

export function PlanView({ plan }: { plan: WorkoutPlan }) {
  const { t } = useI18n()
  const [dayIndex, setDayIndex] = useState(0)
  const day = plan.days[dayIndex] ?? plan.days[0]
  const minutes = plan.days[0]?.estimatedMinutes ?? 0

  return (
    <div className="flex flex-col gap-5 animate-rise-in">
      <Card className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -top-20 -right-16 size-60 rounded-full bg-accent-soft blur-2xl"
          aria-hidden
        />
        <div className="relative">
          <h2 className="text-2xl font-semibold tracking-tight">{plan.name}</h2>
          <p className="mt-1.5 text-[15px] text-muted">{plan.summary}</p>
          <ul className="mt-4 flex flex-wrap gap-2 text-sm">
            <Chip icon={<CalendarDays className="size-4" aria-hidden />}>
              {t('training.daysPerWeek', { count: plan.days.length })}
            </Chip>
            <Chip icon={<Clock className="size-4" aria-hidden />}>
              {t('training.minutes', { count: minutes })}
            </Chip>
            <Chip icon={<TrendingUp className="size-4" aria-hidden />}>
              {t('training.weeks', { count: plan.durationWeeks })}
            </Chip>
          </ul>
        </div>
      </Card>

      {/* Day picker: horizontally scrollable pills, works on any phone width. */}
      <div
        role="tablist"
        aria-label={t('training.title')}
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0"
      >
        {plan.days.map((d, i) => (
          <button
            key={d.title}
            role="tab"
            type="button"
            aria-selected={i === dayIndex}
            onClick={() => {
              setDayIndex(i)
            }}
            className={cx(
              'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors',
              i === dayIndex
                ? 'bg-fg text-bg'
                : 'bg-surface-2 text-muted hover:bg-line hover:text-fg',
            )}
          >
            {d.title.split('·')[0]?.trim() ?? d.title}
          </button>
        ))}
      </div>

      {day && (
        <Card role="tabpanel" key={dayIndex} className="animate-rise-in">
          <h3 className="text-lg font-semibold tracking-tight">{day.title}</h3>
          <p className="text-sm text-muted">{day.focus}</p>

          <Note
            icon={<Flame className="size-4 text-energy" aria-hidden />}
            label={t('training.warmup')}
          >
            {day.warmup}
          </Note>

          <ol className="mt-4 flex flex-col divide-y divide-line">
            {day.exercises.map((exercise, i) => (
              <li key={`${exercise.name}-${i}`} className="flex gap-3 py-3.5">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-2 text-sm font-semibold tabular-nums">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <p className="font-medium">{exercise.name}</p>
                    <p className="text-[15px] font-semibold tabular-nums">
                      {t('training.setsReps', { sets: exercise.sets, reps: exercise.reps })}
                    </p>
                  </div>
                  <p className="mt-0.5 text-sm text-muted">
                    {t(`training.muscles.${exercise.muscleGroup}`)} ·{' '}
                    {t('training.rest', { seconds: exercise.restSeconds })}
                  </p>
                  {exercise.notes && <p className="mt-1 text-sm">{exercise.notes}</p>}
                </div>
              </li>
            ))}
          </ol>

          <Note
            icon={<Snowflake className="size-4 text-fat" aria-hidden />}
            label={t('training.cooldown')}
          >
            {day.cooldown}
          </Note>
        </Card>
      )}

      <Card>
        <h3 className="flex items-center gap-2 font-semibold tracking-tight">
          <TrendingUp className="size-4 text-accent" aria-hidden />
          {t('training.progression')}
        </h3>
        <p className="mt-1.5 text-[15px] text-muted">{plan.progression}</p>
        <h3 className="mt-5 flex items-center gap-2 font-semibold tracking-tight">
          <Lightbulb className="size-4 text-energy" aria-hidden />
          {t('training.tips')}
        </h3>
        <ul className="mt-2 flex flex-col gap-2">
          {plan.tips.map((tip) => (
            <li key={tip} className="flex gap-2 text-[15px] text-muted">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
              {tip}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

function Chip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 font-medium">
      {icon}
      {children}
    </li>
  )
}

function Note({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="mt-4 flex gap-2.5 rounded-2xl bg-surface-2 px-4 py-3 text-sm">
      <span className="mt-0.5">{icon}</span>
      <p>
        <span className="font-medium">{label}: </span>
        <span className="text-muted">{children}</span>
      </p>
    </div>
  )
}

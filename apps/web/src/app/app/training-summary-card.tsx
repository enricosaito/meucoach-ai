'use client'

import { Button, buttonClass, ErrorText, Skeleton } from '@/components/ui'
import { useI18n } from '@/lib/i18n/client'
import { fetchLatestPlan, fetchLatestReadyPlan } from '@/lib/training-data'
import { useWorkoutLog } from '@/lib/use-workout-log'
import type { WorkoutPlanRecord } from '@mycoach/core/training/contracts'
import { ArrowRight, Check, Dumbbell, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { XpFeedbackNote } from './training/xp-feedback'

/** Home entry point to training, the core of the app: today's workout, one tap to log it. */
export function TrainingSummaryCard() {
  const [state, setState] = useState<{
    latest: WorkoutPlanRecord | null
    ready: WorkoutPlanRecord | null
  } | null>(null)

  useEffect(() => {
    void Promise.all([fetchLatestPlan(), fetchLatestReadyPlan()]).then(([latest, ready]) => {
      setState({ latest, ready })
    })
  }, [])

  if (!state) return <Skeleton className="h-48 rounded-3xl" />

  const generating = state.latest?.status === 'pending' || state.latest?.status === 'generating'
  return state.ready?.plan ? (
    <TodayWorkoutSummary ready={state.ready} />
  ) : (
    <NoPlanSummary generating={generating} />
  )
}

function Shell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-fg p-5 text-bg shadow-card sm:p-6">
      <div
        className="pointer-events-none absolute -top-16 -right-12 size-56 rounded-full bg-accent/30 blur-3xl"
        aria-hidden
      />
      <div className="relative">
        <p className="inline-flex items-center gap-1.5 text-sm font-medium opacity-70">
          <Dumbbell className="size-4" aria-hidden />
          {label}
        </p>
        {children}
      </div>
    </section>
  )
}

function TodayWorkoutSummary({ ready }: { ready: WorkoutPlanRecord }) {
  const { t, tc } = useI18n()
  const log = useWorkoutLog(ready)
  const days = ready.plan?.days ?? []

  if (log.loading || !log.today) {
    return <Skeleton className="h-48 rounded-3xl" />
  }

  const { dayIndex, doneToday, thisWeek } = log.today
  const day = days[dayIndex]

  return (
    <Shell label={t('workout.today')}>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight">{day?.title}</h2>
      <p className="mt-1 text-sm opacity-70">
        {day?.focus} · {t('training.minutes', { count: day?.estimatedMinutes ?? 0 })}
      </p>
      {thisWeek > 0 && (
        <p className="mt-1 text-sm opacity-70">{tc('workout.thisWeek', thisWeek)}</p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {doneToday ? (
          <span className="inline-flex h-11 items-center gap-2 rounded-full bg-bg/15 px-5 text-[15px] font-medium">
            <Check className="size-4" strokeWidth={3} aria-hidden />
            {t('workout.doneToday')}
          </span>
        ) : (
          <Button
            loading={log.pendingDay === dayIndex}
            onClick={() => {
              void log.logDay(dayIndex)
            }}
          >
            <Check className="size-4" strokeWidth={3} aria-hidden />
            {t('workout.markDone')}
          </Button>
        )}
        <Link
          href="/app/training"
          className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-[15px] font-medium opacity-80 transition-opacity hover:opacity-100"
        >
          {t('training.viewPlan')}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
      <XpFeedbackNote feedback={log.feedback} className="mt-3" />
      {log.error && <ErrorText>{log.error}</ErrorText>}
    </Shell>
  )
}

function NoPlanSummary({ generating }: { generating: boolean }) {
  const { t } = useI18n()
  return (
    <Shell label={t('training.homeCardTitle')}>
      {generating ? (
        <h2 className="mt-2 flex items-center gap-2 text-xl font-semibold tracking-tight">
          <Loader2 className="size-5 animate-spin" aria-hidden />
          {t('training.generatingTitle')}
        </h2>
      ) : (
        <>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">{t('training.emptyTitle')}</h2>
          <p className="mt-1 text-sm opacity-70">{t('training.homeEmptyBody')}</p>
        </>
      )}
      <Link
        href={generating ? '/app/training' : '/app/training/new'}
        className={`${buttonClass('primary')} mt-5`}
      >
        {generating ? t('training.viewPlan') : t('training.createPlan')}
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </Shell>
  )
}

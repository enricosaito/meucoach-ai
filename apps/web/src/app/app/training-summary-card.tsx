'use client'

import { buttonClass, Skeleton } from '@/components/ui'
import { useI18n } from '@/lib/i18n/client'
import { fetchLatestPlan, fetchLatestReadyPlan } from '@/lib/training-data'
import type { WorkoutPlanRecord } from '@mycoach/core/training/contracts'
import { ArrowRight, Dumbbell, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

/** Home entry point to the training plan: the core of the app. */
export function TrainingSummaryCard() {
  const { t } = useI18n()
  const [state, setState] = useState<{
    latest: WorkoutPlanRecord | null
    ready: WorkoutPlanRecord | null
  } | null>(null)

  useEffect(() => {
    void Promise.all([fetchLatestPlan(), fetchLatestReadyPlan()]).then(([latest, ready]) => {
      setState({ latest, ready })
    })
  }, [])

  if (!state) return <Skeleton className="h-40 rounded-3xl" />

  const generating = state.latest?.status === 'pending' || state.latest?.status === 'generating'
  const plan = state.ready?.plan

  return (
    <section className="relative overflow-hidden rounded-3xl bg-fg p-5 text-bg shadow-card sm:p-6">
      <div
        className="pointer-events-none absolute -top-16 -right-12 size-56 rounded-full bg-accent/30 blur-3xl"
        aria-hidden
      />
      <div className="relative">
        <p className="inline-flex items-center gap-1.5 text-sm font-medium opacity-70">
          <Dumbbell className="size-4" aria-hidden />
          {t('training.homeCardTitle')}
        </p>
        {plan ? (
          <>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">{plan.name}</h2>
            <p className="mt-1 text-sm opacity-70">
              {t('training.homeCardBody', {
                days: plan.days.length,
                minutes: plan.days[0]?.estimatedMinutes ?? 0,
              })}
            </p>
          </>
        ) : generating ? (
          <h2 className="mt-2 flex items-center gap-2 text-xl font-semibold tracking-tight">
            <Loader2 className="size-5 animate-spin" aria-hidden />
            {t('training.generatingTitle')}
          </h2>
        ) : (
          <>
            <h2 className="mt-2 text-xl font-semibold tracking-tight">
              {t('training.emptyTitle')}
            </h2>
            <p className="mt-1 text-sm opacity-70">{t('training.homeEmptyBody')}</p>
          </>
        )}
        <Link
          href={plan || generating ? '/app/training' : '/app/training/new'}
          className={`${buttonClass('primary')} mt-5`}
        >
          {plan || generating ? t('training.viewPlan') : t('training.createPlan')}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </section>
  )
}

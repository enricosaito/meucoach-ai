'use client'

import { Card, Skeleton } from '@/components/ui'
import { fetchLatestDietPlan, fetchLatestReadyDietPlan } from '@/lib/diet-data'
import { useI18n } from '@/lib/i18n/client'
import { planTotals, type DietPlanRecord } from '@mycoach/core/nutrition/contracts'
import { ChevronRight, Loader2, Salad } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

/** Home entry point to the diet: the current plan at a glance, or a prompt to create one. */
export function DietSummaryCard() {
  const { t, formatNumber } = useI18n()
  const [state, setState] = useState<{
    latest: DietPlanRecord | null
    ready: DietPlanRecord | null
  } | null>(null)

  useEffect(() => {
    void Promise.all([fetchLatestDietPlan(), fetchLatestReadyDietPlan()])
      .then(([latest, ready]) => {
        setState({ latest, ready })
      })
      .catch(() => {
        setState({ latest: null, ready: null })
      })
  }, [])

  if (!state) return <Skeleton className="h-24 rounded-3xl" />

  const plan = state.ready?.plan
  const generating = state.latest?.status === 'pending' || state.latest?.status === 'generating'

  return (
    <Link href={plan || generating ? '/app/diet' : '/app/diet/new'} className="group block">
      <Card className="flex items-center gap-4 transition-colors group-hover:bg-surface-2">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent">
          {generating && !plan ? (
            <Loader2 className="size-6 animate-spin" aria-hidden />
          ) : (
            <Salad className="size-6" aria-hidden />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted">{t('diet.homeCardTitle')}</p>
          {plan ? (
            <>
              <p className="truncate font-semibold tracking-tight">{plan.name}</p>
              <p className="text-sm text-muted">
                {t('diet.homeCardBody', {
                  meals: plan.meals.length,
                  kcal: formatNumber(planTotals(plan).kcal),
                })}
              </p>
            </>
          ) : generating ? (
            <p className="font-semibold tracking-tight">{t('diet.generatingTitle')}</p>
          ) : (
            <>
              <p className="font-semibold tracking-tight">{t('diet.createPlan')}</p>
              <p className="text-sm text-muted">{t('diet.homeEmptyBody')}</p>
            </>
          )}
        </div>
        <ChevronRight
          className="size-5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </Card>
    </Link>
  )
}

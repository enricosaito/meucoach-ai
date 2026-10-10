'use client'

import { buttonClass, Card, cx, ErrorText, PageHeader, Skeleton } from '@/components/ui'
import { fetchLatestDietPlan, fetchLatestReadyDietPlan } from '@/lib/diet-data'
import { errorMessage, useI18n } from '@/lib/i18n/client'
import type { DailyTargets, DietPlanRecord } from '@mycoach/core/nutrition/contracts'
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Flame,
  Info,
  Loader2,
  RefreshCw,
  Salad,
} from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useMe } from '../me-context'
import { DietPlanView } from './diet-plan-view'

const POLL_MS = 3000

interface DietState {
  latest: DietPlanRecord | null
  ready: DietPlanRecord | null
}

function inProgress(plan: DietPlanRecord | null) {
  return plan?.status === 'pending' || plan?.status === 'generating'
}

/** The plan's targets differ from today's (new energy test or goal since it was built). */
function isOutdated(plan: DietPlanRecord, targets: DailyTargets | null) {
  if (!plan.targets || !targets) return false
  return plan.targets.kcal !== targets.kcal || plan.targets.proteinG !== targets.proteinG
}

export function DietView() {
  const { t } = useI18n()
  const { me } = useMe()
  const [state, setState] = useState<DietState | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    Promise.all([fetchLatestDietPlan(), fetchLatestReadyDietPlan()])
      .then(([latest, ready]) => {
        setState({ latest, ready })
        setError('')
      })
      .catch((e: unknown) => {
        setError(errorMessage(t, e))
      })
  }, [t])

  useEffect(load, [load])

  const generating = inProgress(state?.latest ?? null)
  useEffect(() => {
    if (!generating) return
    const timer = setInterval(load, POLL_MS)
    return () => {
      clearInterval(timer)
    }
  }, [generating, load])

  if (error && !state) return <ErrorText>{error}</ErrorText>
  if (!state || !me) {
    return (
      <div className="flex flex-col gap-5" aria-busy aria-label={t('common.loading')}>
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-40 rounded-3xl" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    )
  }

  const { latest, ready } = state
  if (!latest) return me.targets ? <EmptyState /> : <NeedsTestState />

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={t('diet.title')} description={t('diet.description')} />

      {generating && <GeneratingCard />}
      {latest.status === 'failed' && <FailedCard />}

      {ready?.plan && (
        <>
          {!generating && isOutdated(ready, me.targets) && (
            <p className="flex items-start gap-2 rounded-2xl bg-energy-soft px-4 py-3 text-sm">
              <Info className="mt-0.5 size-4 shrink-0 text-energy" aria-hidden />
              <Link href="/app/diet/new" className="font-medium underline">
                {t('diet.outdated')}
              </Link>
            </p>
          )}
          <DietPlanView plan={ready.plan} targets={ready.targets} />
          {!generating && (
            <Link
              href="/app/diet/new"
              className="inline-flex items-center justify-center gap-2 self-center rounded-full px-4 py-2 text-sm font-medium text-accent hover:bg-accent-soft"
            >
              <RefreshCw className="size-4" aria-hidden />
              {t('diet.updatePlan')}
            </Link>
          )}
        </>
      )}
    </div>
  )
}

function IntroCard({
  icon,
  title,
  body,
  href,
  cta,
  tone,
}: {
  icon: React.ReactNode
  title: string
  body: string
  href: string
  cta: string
  tone: 'accent' | 'energy'
}) {
  const { t } = useI18n()
  return (
    <div className="flex flex-col gap-5 animate-rise-in">
      <PageHeader title={t('diet.title')} />
      <Card className="relative overflow-hidden">
        <div
          className={cx(
            'pointer-events-none absolute -top-16 -right-12 size-56 rounded-full blur-2xl',
            tone === 'accent' ? 'bg-accent-soft' : 'bg-energy-soft',
          )}
          aria-hidden
        />
        <div className="relative">
          <span
            className={cx(
              'grid size-12 place-items-center rounded-2xl',
              tone === 'accent' ? 'bg-accent-soft text-accent' : 'bg-energy-soft text-energy',
            )}
          >
            {icon}
          </span>
          <h2 className="mt-4 text-xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-1.5 text-[15px] text-muted">{body}</p>
          <Link href={href} className={cx(buttonClass('primary'), 'mt-6')}>
            {cta}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </Card>
    </div>
  )
}

function EmptyState() {
  const { t } = useI18n()
  return (
    <IntroCard
      tone="accent"
      icon={<Salad className="size-6" aria-hidden />}
      title={t('diet.emptyTitle')}
      body={t('diet.emptyBody')}
      href="/app/diet/new"
      cta={t('diet.createPlan')}
    />
  )
}

function NeedsTestState() {
  const { t } = useI18n()
  return (
    <IntroCard
      tone="energy"
      icon={<Flame className="size-6" aria-hidden />}
      title={t('diet.needsTestTitle')}
      body={t('diet.needsTestBody')}
      href="/app/energy"
      cta={t('diet.takeTest')}
    />
  )
}

/** Cosmetic progress: real status comes from polling, steps advance with elapsed time. */
function GeneratingCard() {
  const { t } = useI18n()
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((s) => s + 1)
    }, 1000)
    return () => {
      clearInterval(timer)
    }
  }, [])

  const steps = [t('diet.stepDesigning'), t('diet.stepBalancing'), t('diet.stepChecking')]
  const current = Math.min(steps.length - 1, Math.floor(elapsed / 12))

  return (
    <Card className="animate-rise-in" aria-live="polite">
      <h2 className="text-lg font-semibold tracking-tight">{t('diet.generatingTitle')}</h2>
      <p className="mt-1 text-sm text-muted">{t('diet.generatingBody')}</p>
      <ol className="mt-5 flex flex-col gap-3">
        {steps.map((label, i) => (
          <li key={label} className="flex items-center gap-3 text-[15px]">
            <span
              className={cx(
                'grid size-6 place-items-center rounded-full',
                i < current
                  ? 'bg-accent text-accent-fg'
                  : i === current
                    ? 'bg-accent-soft text-accent'
                    : 'bg-surface-2 text-muted',
              )}
            >
              {i < current ? (
                <Check className="size-3.5" strokeWidth={3} aria-hidden />
              ) : i === current ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : (
                <span className="size-1.5 rounded-full bg-current" />
              )}
            </span>
            <span className={i > current ? 'text-muted' : ''}>{label}</span>
          </li>
        ))}
      </ol>
    </Card>
  )
}

function FailedCard() {
  const { t } = useI18n()
  return (
    <Card className="border-danger/30">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden />
        <div>
          <h2 className="font-semibold tracking-tight">{t('diet.failedTitle')}</h2>
          <p className="mt-1 text-sm text-muted">{t('diet.failedBody')}</p>
          <Link href="/app/diet/new" className={cx(buttonClass('secondary', 'sm'), 'mt-3')}>
            <RefreshCw className="size-4" aria-hidden />
            {t('common.tryAgain')}
          </Link>
        </div>
      </div>
    </Card>
  )
}

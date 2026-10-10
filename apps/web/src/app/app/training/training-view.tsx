'use client'

import { buttonClass, Card, cx, ErrorText, PageHeader, Skeleton } from '@/components/ui'
import { errorMessage, useI18n } from '@/lib/i18n/client'
import { fetchLatestPlan, fetchLatestReadyPlan, fetchScans } from '@/lib/training-data'
import { useWorkoutLog } from '@/lib/use-workout-log'
import type { BodyScan, WorkoutPlan, WorkoutPlanRecord } from '@mycoach/core/training/contracts'
import { AlertTriangle, ArrowRight, Check, Dumbbell, Loader2, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { BodyAnalysisCard } from './body-analysis-card'
import { PlanView } from './plan-view'
import { ProgressPhotos } from './progress-photos'

const POLL_MS = 3000

interface TrainingState {
  latest: WorkoutPlanRecord | null
  ready: WorkoutPlanRecord | null
  scans: BodyScan[]
}

async function fetchTrainingState(): Promise<TrainingState> {
  const [latest, ready, scans] = await Promise.all([
    fetchLatestPlan(),
    fetchLatestReadyPlan(),
    fetchScans(),
  ])
  return { latest, ready, scans }
}

function inProgress(plan: WorkoutPlanRecord | null) {
  return plan?.status === 'pending' || plan?.status === 'generating'
}

export function TrainingView() {
  const { t } = useI18n()
  const [state, setState] = useState<TrainingState | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    fetchTrainingState()
      .then((next) => {
        setState(next)
        setError('')
      })
      .catch((e: unknown) => {
        setError(errorMessage(t, e))
      })
  }, [t])

  useEffect(load, [load])

  // While a plan is being generated, poll until it is ready or failed.
  const generating = inProgress(state?.latest ?? null)
  useEffect(() => {
    if (!generating) return
    const timer = setInterval(load, POLL_MS)
    return () => {
      clearInterval(timer)
    }
  }, [generating, load])

  if (error && !state) return <ErrorText>{error}</ErrorText>
  if (!state) {
    return (
      <div className="flex flex-col gap-5" aria-busy aria-label={t('common.loading')}>
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-40 rounded-3xl" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    )
  }

  const { latest, ready, scans } = state
  const analysisScan = ready?.bodyScanId ? scans.find((s) => s.id === ready.bodyScanId) : undefined

  if (!latest) return <EmptyState />

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={t('training.title')} description={t('training.description')} />

      {generating && <GeneratingCard withPhotos={latest.bodyScanId !== null} />}
      {latest.status === 'failed' && <FailedCard />}

      {ready?.plan && (
        <>
          <LoggablePlan ready={ready} plan={ready.plan} />
          {analysisScan?.analysis && <BodyAnalysisCard analysis={analysisScan.analysis} />}
          {!generating && (
            <Link
              href="/app/training/new"
              className="inline-flex items-center justify-center gap-2 self-center rounded-full px-4 py-2 text-sm font-medium text-accent-text hover:bg-accent-soft"
            >
              <RefreshCw className="size-4" aria-hidden />
              {t('training.updatePlan')}
            </Link>
          )}
        </>
      )}

      <ProgressPhotos scans={scans} onChange={load} />
    </div>
  )
}

function LoggablePlan({ ready, plan }: { ready: WorkoutPlanRecord; plan: WorkoutPlan }) {
  const log = useWorkoutLog(ready)
  return <PlanView plan={plan} log={log} />
}

function EmptyState() {
  const { t } = useI18n()
  return (
    <div className="flex flex-col gap-5 animate-rise-in">
      <PageHeader title={t('training.title')} />
      <Card className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -top-16 -right-12 size-56 rounded-full bg-accent-soft blur-2xl"
          aria-hidden
        />
        <div className="relative">
          <span className="grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent-text">
            <Dumbbell className="size-6" aria-hidden />
          </span>
          <h2 className="mt-4 text-xl font-semibold tracking-tight">{t('training.emptyTitle')}</h2>
          <p className="mt-1.5 text-[15px] text-muted">{t('training.emptyBody')}</p>
          <Link
            href="/app/training/new"
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-[15px] font-medium text-accent-fg transition-[background-color,transform] hover:bg-accent-strong active:scale-[0.97]"
          >
            {t('training.createPlan')}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </Card>
    </div>
  )
}

/** Cosmetic progress: real status comes from polling, steps advance with elapsed time. */
function GeneratingCard({ withPhotos }: { withPhotos: boolean }) {
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

  const steps = [
    ...(withPhotos ? [t('training.stepAnalyzing')] : []),
    t('training.stepDesigning'),
    t('training.stepChecking'),
  ]
  const current = Math.min(steps.length - 1, Math.floor(elapsed / 12))

  return (
    <Card className="animate-rise-in" aria-live="polite">
      <h2 className="text-lg font-semibold tracking-tight">{t('training.generatingTitle')}</h2>
      <p className="mt-1 text-sm text-muted">{t('training.generatingBody')}</p>
      <ol className="mt-5 flex flex-col gap-3">
        {steps.map((label, i) => (
          <li key={label} className="flex items-center gap-3 text-[15px]">
            <span
              className={`grid size-6 place-items-center rounded-full ${
                i < current
                  ? 'bg-accent text-accent-fg'
                  : i === current
                    ? 'bg-accent-soft text-accent-text'
                    : 'bg-surface-2 text-muted'
              }`}
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
          <h2 className="font-semibold tracking-tight">{t('training.failedTitle')}</h2>
          <p className="mt-1 text-sm text-muted">{t('training.failedBody')}</p>
          <Link href="/app/training/new" className={cx(buttonClass('secondary', 'sm'), 'mt-3')}>
            <RefreshCw className="size-4" aria-hidden />
            {t('common.tryAgain')}
          </Link>
        </div>
      </div>
    </Card>
  )
}

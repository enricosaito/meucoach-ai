'use client'

import { TargetsCard } from '@/components/targets-card'
import { Button, Card, ErrorText, Skeleton } from '@/components/ui'
import { useI18n } from '@/lib/i18n/client'
import { COACH_SUGGESTION_KEYS } from '@/lib/labels'
import { ArrowRight, Flame, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { DietSummaryCard } from './diet-summary-card'
import { HomeHeader } from './home-header'
import { useMe } from './me-context'
import { TrainingSummaryCard } from './training-summary-card'

export function HomeView() {
  const { me, error, reload } = useMe()
  const { t, formatNumber, formatDate } = useI18n()

  if (error) {
    return (
      <div className="flex flex-col items-start gap-3">
        <ErrorText>{error}</ErrorText>
        <Button variant="secondary" size="sm" onClick={reload}>
          {t('common.tryAgain')}
        </Button>
      </div>
    )
  }
  if (!me) return <HomeSkeleton label={t('common.loading')} />

  const goal = me.profile.goals.primary
  const assessment = me.latestAssessment

  return (
    <div className="flex flex-col gap-5 animate-rise-in">
      <HomeHeader me={me} />

      <TrainingSummaryCard />

      {me.targets && <DietSummaryCard />}

      {me.targets && assessment ? (
        <>
          <TargetsCard targets={me.targets} goal={goal} />
          <Card className="relative overflow-hidden">
            <div
              className="pointer-events-none absolute -top-20 -right-16 size-56 rounded-full bg-energy-soft blur-2xl"
              aria-hidden
            />
            <div className="relative">
              <div className="flex items-center justify-between">
                <p className="inline-flex items-center gap-1.5 text-sm font-medium text-muted">
                  <Flame className="size-4 text-energy" aria-hidden />
                  {t('home.dailyEnergy')}
                </p>
                <Link
                  href="/app/energy"
                  className="rounded-full px-2 py-1 text-sm font-medium text-accent hover:bg-accent-soft"
                >
                  {t('home.retake')}
                </Link>
              </div>
              <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <dt className="text-muted">{t('energy.tdee')}</dt>
                  <dd className="mt-0.5 text-lg font-semibold tabular-nums">
                    {formatNumber(assessment.tdeeKcal)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">{t('home.atRest')}</dt>
                  <dd className="mt-0.5 text-lg font-semibold tabular-nums">
                    {formatNumber(assessment.bmrKcal)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">{t('home.measured')}</dt>
                  <dd className="mt-0.5 text-lg font-semibold">
                    {formatDate(assessment.createdAt, { day: 'numeric', month: 'short' })}
                  </dd>
                </div>
              </dl>
            </div>
          </Card>
        </>
      ) : (
        <Card className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full bg-energy-soft blur-2xl"
            aria-hidden
          />
          <div className="relative">
            <span className="grid size-11 place-items-center rounded-2xl bg-energy-soft text-energy">
              <Flame className="size-6" aria-hidden />
            </span>
            <h2 className="mt-4 text-lg font-semibold tracking-tight">{t('home.emptyTitle')}</h2>
            <p className="mt-1 text-[15px] text-muted">{t('home.emptyBody')}</p>
            <Link
              href="/app/energy"
              className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-[15px] font-medium text-accent-fg transition-[background-color,transform] hover:bg-accent-strong active:scale-[0.97]"
            >
              {t('home.takeTest')}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </Card>
      )}

      <Card>
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-accent-soft text-accent">
            <MessageCircle className="size-6" aria-hidden />
          </span>
          <div>
            <h2 className="font-semibold tracking-tight">{t('home.coachTitle')}</h2>
            <p className="text-sm text-muted">{t('home.coachSubtitle')}</p>
          </div>
        </div>
        <ul className="mt-4 flex flex-col gap-2">
          {COACH_SUGGESTION_KEYS.map((key) => (
            <li key={key}>
              <Link
                href={`/app/coach?q=${encodeURIComponent(t(key))}`}
                className="group flex items-center justify-between gap-3 rounded-2xl bg-surface-2 px-4 py-3 text-[15px] transition-colors hover:bg-line"
              >
                {t(key)}
                <ArrowRight
                  className="size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

function HomeSkeleton({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-5" aria-busy aria-label={label}>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-44" />
        <Skeleton className="mt-2 h-8 w-32 rounded-full" />
      </div>
      <Skeleton className="h-64 rounded-3xl" />
      <Skeleton className="h-32 rounded-3xl" />
      <Skeleton className="h-64 rounded-3xl" />
    </div>
  )
}

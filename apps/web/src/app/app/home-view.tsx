'use client'

import { Button, Card, ErrorText, Skeleton } from '@/components/ui'
import {
  ACTIVITY_LABELS,
  COACH_SUGGESTIONS,
  formatDate,
  formatKcal,
  GOAL_LABELS,
  greeting,
} from '@/lib/labels'
import { ArrowRight, ChevronRight, Flame, MessageCircle, Target } from 'lucide-react'
import Link from 'next/link'
import { useMe } from './me-context'

export function HomeView() {
  const { me, error, reload } = useMe()

  if (error) {
    return (
      <div className="flex flex-col items-start gap-3">
        <ErrorText>{error}</ErrorText>
        <Button variant="secondary" size="sm" onClick={reload}>
          Try again
        </Button>
      </div>
    )
  }
  if (!me) return <HomeSkeleton />

  const firstName = me.profile.displayName?.split(/\s+/)[0]
  const goal = me.profile.goals.primary
  const assessment = me.latestAssessment

  return (
    <div className="flex flex-col gap-5 animate-rise-in">
      <header className="mb-1">
        <p className="text-[15px] text-muted">{greeting()}</p>
        <h1 className="text-3xl font-semibold tracking-tight">{firstName ?? 'Welcome'}</h1>
        <Link
          href="/app/profile"
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-surface-2 py-1.5 pr-3 pl-2.5 text-sm font-medium transition-colors hover:bg-line"
        >
          <Target className="size-4 text-accent" aria-hidden />
          {goal ? GOAL_LABELS[goal].label : 'Set your goal'}
          <ChevronRight className="size-4 text-muted" aria-hidden />
        </Link>
      </header>

      {assessment ? (
        <Card className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute -top-20 -right-16 size-56 rounded-full bg-energy-soft blur-2xl"
            aria-hidden
          />
          <div className="relative">
            <div className="flex items-center justify-between">
              <p className="inline-flex items-center gap-1.5 text-sm font-medium text-muted">
                <Flame className="size-4 text-energy" aria-hidden />
                Daily energy
              </p>
              <Link
                href="/app/energy"
                className="rounded-full px-2 py-1 text-sm font-medium text-accent hover:bg-accent-soft"
              >
                Retake
              </Link>
            </div>
            <p className="mt-3 flex items-baseline gap-2">
              <span className="text-5xl font-semibold tracking-tight tabular-nums">
                {formatKcal(assessment.tdeeKcal)}
              </span>
              <span className="text-[15px] text-muted">kcal / day</span>
            </p>
            <p className="mt-1 text-sm text-muted">
              Maintenance calories · {ACTIVITY_LABELS[assessment.activityLevel].label.toLowerCase()}
            </p>
            <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm">
              <div>
                <dt className="text-muted">At rest (BMR)</dt>
                <dd className="mt-0.5 font-semibold tabular-nums">
                  {formatKcal(assessment.bmrKcal)} kcal
                </dd>
              </div>
              <div>
                <dt className="text-muted">Measured</dt>
                <dd className="mt-0.5 font-semibold">{formatDate(assessment.createdAt)}</dd>
              </div>
            </dl>
          </div>
        </Card>
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
            <h2 className="mt-4 text-lg font-semibold tracking-tight">
              Find your daily calorie needs
            </h2>
            <p className="mt-1 text-[15px] text-muted">
              A one-minute test that estimates how much energy your body uses. Your coach uses it to
              personalise advice.
            </p>
            <Link
              href="/app/energy"
              className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-[15px] font-medium text-accent-fg transition-[background-color,transform] hover:bg-accent-strong active:scale-[0.97]"
            >
              Take the test
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
            <h2 className="font-semibold tracking-tight">Ask your coach</h2>
            <p className="text-sm text-muted">Training, nutrition, sleep and habits</p>
          </div>
        </div>
        <ul className="mt-4 flex flex-col gap-2">
          {COACH_SUGGESTIONS.map((question) => (
            <li key={question}>
              <Link
                href={`/app/coach?q=${encodeURIComponent(question)}`}
                className="group flex items-center justify-between gap-3 rounded-2xl bg-surface-2 px-4 py-3 text-[15px] transition-colors hover:bg-line"
              >
                {question}
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

function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy aria-label="Loading">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-44" />
        <Skeleton className="mt-2 h-8 w-32 rounded-full" />
      </div>
      <Skeleton className="h-56 rounded-3xl" />
      <Skeleton className="h-64 rounded-3xl" />
    </div>
  )
}

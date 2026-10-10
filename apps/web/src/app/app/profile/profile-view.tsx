'use client'

import { TargetsCard } from '@/components/targets-card'
import { Avatar, buttonClass, Card, cx, Skeleton } from '@/components/ui'
import { avatarUrl } from '@/lib/avatar'
import { fetchLatestReadyDietPlan } from '@/lib/diet-data'
import { useI18n } from '@/lib/i18n/client'
import { fetchLatestReadyPlan } from '@/lib/training-data'
import {
  cmToFeetInches,
  greetingName,
  kgToPounds,
  type Assessment,
  type UnitSystem,
} from '@mycoach/core/profile/contracts'
import {
  ChevronRight,
  Dumbbell,
  Flame,
  Pencil,
  Ruler,
  Salad,
  Settings,
  Star,
  Target,
  Trophy,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState, type ReactNode } from 'react'
import { useMe, type MeWithTargets } from '../me-context'
import { GOAL_ICONS } from './settings/profile-settings'

/** Read-only overview of the user. Everything editable lives in Settings (the cog). */
export function ProfileView() {
  const { me } = useMe()
  const { t } = useI18n()

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t('profile.title')}
          </h1>
        </div>
        <Link
          href="/app/profile/settings"
          aria-label={t('profile.settings')}
          title={t('profile.settings')}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-surface-2 text-muted transition-[background-color,color,transform] hover:bg-line hover:text-fg active:scale-95"
        >
          <Settings className="size-5" aria-hidden />
        </Link>
      </header>

      {me ? (
        <>
          <IdentityCard me={me} />
          <StatsRow me={me} />
          <BodyCard assessment={me.latestAssessment} units={me.profile.units} />
          {me.targets && <TargetsCard targets={me.targets} goal={me.profile.goals.primary} />}
          <PlansCard />
        </>
      ) : (
        <>
          <Skeleton className="h-56 rounded-3xl" />
          <Skeleton className="h-24 rounded-3xl" />
          <Skeleton className="h-48 rounded-3xl" />
        </>
      )}
    </div>
  )
}

function IdentityCard({ me }: { me: MeWithTargets }) {
  const { t } = useI18n()
  const { profile } = me
  const goal = profile.goals.primary
  const GoalIcon = goal ? GOAL_ICONS[goal] : Target

  return (
    <Card className="flex flex-col items-center text-center">
      <Avatar
        name={greetingName(profile)}
        src={avatarUrl(profile.avatarPath)}
        className="size-24 text-3xl"
      />
      <p className="mt-4 text-xl font-semibold tracking-tight">{greetingName(profile)}</p>
      <p className="text-[15px] text-muted">@{profile.username}</p>
      <p
        className={cx(
          'mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium',
          goal ? 'bg-accent-soft text-accent' : 'bg-surface-2 text-muted',
        )}
      >
        <GoalIcon className="size-4" aria-hidden />
        {goal ? t(`goals.${goal}.label`) : t('profile.noGoal')}
      </p>
      <Link href="/app/profile/settings" className={cx(buttonClass('secondary', 'sm'), 'mt-4')}>
        <Pencil className="size-4" aria-hidden />
        {t('profile.editProfile')}
      </Link>
    </Card>
  )
}

function StatsRow({ me }: { me: MeWithTargets }) {
  const { t, formatNumber } = useI18n()
  const stats: { icon: ReactNode; label: string; value: string }[] = [
    {
      icon: <Star className="size-4 text-accent" aria-hidden />,
      label: t('profile.level'),
      value: formatNumber(me.level.level),
    },
    {
      icon: <Flame className="size-4 text-energy" aria-hidden />,
      label: t('profile.streak'),
      value: formatNumber(me.streak.current),
    },
    {
      icon: <Trophy className="size-4 text-fat" aria-hidden />,
      label: t('profile.bestStreak'),
      value: formatNumber(me.streak.longest),
    },
  ]
  return (
    <dl className="grid grid-cols-3 gap-3">
      {stats.map((s) => (
        <Card key={s.label} className="px-4 py-4 sm:px-5">
          <dt className="flex items-center gap-1.5 text-sm text-muted">
            {s.icon}
            {s.label}
          </dt>
          <dd className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{s.value}</dd>
        </Card>
      ))}
    </dl>
  )
}

function BodyCard({ assessment, units }: { assessment: Assessment | null; units: UnitSystem }) {
  const { t, formatNumber, formatDate } = useI18n()

  if (!assessment) {
    return (
      <Link
        href="/app/energy"
        className="flex items-center gap-3 rounded-3xl border border-line bg-surface px-5 py-4 shadow-card transition-colors hover:bg-surface-2"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-energy-soft text-energy">
          <Flame className="size-5" aria-hidden />
        </span>
        <span className="flex-1 text-[15px]">{t('profile.bodyEmpty')}</span>
        <ChevronRight className="size-5 text-muted" aria-hidden />
      </Link>
    )
  }

  const imperial = units === 'imperial'
  const { feet, inches } = cmToFeetInches(assessment.heightCm)
  const rows: [string, string][] = [
    [
      t('profile.height'),
      imperial ? `${String(feet)}′ ${String(inches)}″` : `${formatNumber(assessment.heightCm)} cm`,
    ],
    [
      t('profile.weight'),
      imperial
        ? `${formatNumber(kgToPounds(assessment.weightKg))} lb`
        : `${formatNumber(assessment.weightKg)} kg`,
    ],
    [t('profile.age'), t('profile.ageYears', { count: assessment.ageYears })],
    [t('profile.activityLevel'), t(`activity.${assessment.activityLevel}.label`)],
  ]

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-semibold tracking-tight">
          <Ruler className="size-4 text-accent" aria-hidden />
          {t('profile.bodyTitle')}
        </h2>
        <span className="text-sm text-muted">
          {t('profile.measuredOn', {
            date: formatDate(assessment.createdAt, { day: 'numeric', month: 'short' }),
          })}
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="text-[15px] font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      <Link
        href="/app/energy"
        className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3 text-sm font-medium text-accent"
      >
        {t('profile.energyLink')}
        <ChevronRight className="size-4" aria-hidden />
      </Link>
    </Card>
  )
}

function PlansCard() {
  const { t } = useI18n()
  const [names, setNames] = useState<{ training: string | null; diet: string | null } | null>(null)

  useEffect(() => {
    void Promise.all([fetchLatestReadyPlan(), fetchLatestReadyDietPlan()])
      .then(([training, diet]) => {
        setNames({ training: training?.plan?.name ?? null, diet: diet?.plan?.name ?? null })
      })
      .catch(() => {
        setNames({ training: null, diet: null })
      })
  }, [])

  const rows = [
    {
      href: '/app/training',
      icon: <Dumbbell className="size-5" aria-hidden />,
      label: t('profile.trainingPlan'),
      value: names?.training,
    },
    {
      href: '/app/diet',
      icon: <Salad className="size-5" aria-hidden />,
      label: t('profile.dietPlan'),
      value: names?.diet,
    },
  ]

  return (
    <Card>
      <h2 className="font-semibold tracking-tight">{t('profile.plansTitle')}</h2>
      <ul className="mt-2 flex flex-col divide-y divide-line">
        {rows.map((row) => (
          <li key={row.href}>
            <Link href={row.href} className="group flex items-center gap-3 py-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent">
                {row.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm text-muted">{row.label}</span>
                {names ? (
                  <span className="block truncate font-medium">
                    {row.value ?? t('profile.noPlan')}
                  </span>
                ) : (
                  <Skeleton className="mt-1 h-4 w-32" />
                )}
              </span>
              <ChevronRight
                className="size-5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  )
}

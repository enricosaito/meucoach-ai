'use client'

import {
  Avatar,
  Button,
  Card,
  cx,
  ErrorText,
  Field,
  inputClass,
  PageHeader,
  Segmented,
  SectionTitle,
  Skeleton,
} from '@/components/ui'
import { getApi, unwrap, writeHeaders } from '@/lib/api'
import { useI18n } from '@/lib/i18n/client'
import { useWrite } from '@/lib/use-write'
import {
  GOAL_TYPES,
  type Goals,
  type Profile,
  type UnitSystem,
} from '@mycoach/core/profile/contracts'
import { LOCALES, type Locale } from '@mycoach/i18n'
import {
  Check,
  Dumbbell,
  HeartPulse,
  LogOut,
  Scale,
  TrendingDown,
  type LucideIcon,
} from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useMe } from '../me-context'
import { PrivacyCard } from './privacy-card'

type GoalType = (typeof GOAL_TYPES)[number]

const GOAL_ICONS: Record<GoalType, LucideIcon> = {
  lose_fat: TrendingDown,
  maintain: Scale,
  build_muscle: Dumbbell,
  improve_health: HeartPulse,
}

export function ProfileView() {
  const { me } = useMe()
  const { t } = useI18n()

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={t('profile.title')} description={t('profile.description')} />
      {me ? <ProfileForm profile={me.profile} /> : <Skeleton className="h-[40rem] rounded-3xl" />}
      <PrivacyCard />
      <Card className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold tracking-tight">{t('auth.signOutTitle')}</h2>
          <p className="text-sm text-muted">{t('auth.signOutDescription')}</p>
        </div>
        <form action="/auth/signout" method="post">
          <Button type="submit" variant="secondary" size="sm">
            <LogOut className="size-4" aria-hidden />
            {t('auth.signOut')}
          </Button>
        </form>
      </Card>
    </div>
  )
}

function ProfileForm({ profile }: { profile: Profile }) {
  const { t } = useI18n()
  // Saving a new language updates the profile; MeProvider then switches the UI to match.
  const { setProfile } = useMe()
  const [displayName, setDisplayName] = useState(profile.displayName ?? '')
  const [units, setUnits] = useState<UnitSystem>(profile.units)
  const [locale, setLocaleChoice] = useState<Locale>(profile.locale)
  const [goal, setGoal] = useState<Goals['primary']>(profile.goals.primary)
  const [saved, setSaved] = useState(false)
  const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const dirty =
    displayName.trim() !== (profile.displayName ?? '') ||
    units !== profile.units ||
    locale !== profile.locale ||
    goal !== profile.goals.primary ||
    browserTimeZone !== profile.timezone

  const save = useWrite((key) =>
    unwrap(
      getApi().api.v1.me.profile.$patch(
        {
          json: {
            displayName: displayName.trim() || null,
            units,
            locale,
            timezone: browserTimeZone,
            goals: goal ? { ...profile.goals, primary: goal } : profile.goals,
          },
        },
        { headers: writeHeaders(key) },
      ),
    ),
  )

  function changed() {
    save.reset()
    setSaved(false)
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const result = await save.run()
    if (result) {
      setProfile(result.profile)
      setSaved(true)
    }
  }

  return (
    <Card>
      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Avatar name={displayName || null} className="size-14 text-lg" />
          <div className="min-w-0 flex-1">
            <Field label={t('profile.name')} htmlFor="display-name">
              <input
                id="display-name"
                className={inputClass}
                value={displayName}
                maxLength={80}
                autoComplete="given-name"
                placeholder={t('profile.namePlaceholder')}
                onChange={(e) => {
                  setDisplayName(e.target.value)
                  changed()
                }}
              />
            </Field>
          </div>
        </div>

        <fieldset>
          <SectionTitle title={t('profile.mainGoal')} description={t('profile.mainGoalHelp')} />
          <div className="grid grid-cols-2 gap-2.5">
            {GOAL_TYPES.map((g) => {
              const Icon = GOAL_ICONS[g]
              const checked = goal === g
              return (
                <label
                  key={g}
                  className={cx(
                    'relative flex cursor-pointer flex-col gap-2 rounded-2xl border p-3.5 transition-[border-color,background-color] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent',
                    checked
                      ? 'border-accent bg-accent-soft'
                      : 'border-line bg-surface hover:bg-surface-2',
                  )}
                >
                  <input
                    type="radio"
                    name="goal"
                    value={g}
                    checked={checked}
                    onChange={() => {
                      setGoal(g)
                      changed()
                    }}
                    className="sr-only"
                  />
                  <Icon
                    className={cx('size-5', checked ? 'text-accent' : 'text-muted')}
                    aria-hidden
                  />
                  <span>
                    <span className="block text-[15px] font-medium">{t(`goals.${g}.label`)}</span>
                    <span className="block text-xs text-muted">{t(`goals.${g}.description`)}</span>
                  </span>
                  {checked && (
                    <Check
                      className="absolute top-3 right-3 size-4 text-accent"
                      strokeWidth={3}
                      aria-hidden
                    />
                  )}
                </label>
              )
            })}
          </div>
        </fieldset>

        <Field label={t('language.label')} hint={t('profile.languageHelp')}>
          <Segmented
            label={t('language.label')}
            value={locale}
            onChange={(value) => {
              setLocaleChoice(value)
              changed()
            }}
            options={LOCALES.map((l) => ({ value: l, label: t(`language.${l}`) }))}
          />
        </Field>

        <Field label={t('profile.units')} hint={t('profile.unitsHelp')}>
          <Segmented
            label={t('profile.units')}
            value={units}
            onChange={(value) => {
              setUnits(value)
              changed()
            }}
            options={[
              { value: 'metric', label: t('profile.unitsMetric') },
              { value: 'imperial', label: t('profile.unitsImperial') },
            ]}
          />
        </Field>

        <Field label={t('profile.timezone')} hint={t('profile.timezoneHelp')}>
          <div className={cx(inputClass, 'flex items-center bg-surface-2 text-muted')}>
            {browserTimeZone.replaceAll('_', ' ')}
          </div>
        </Field>

        <ErrorText>{save.error}</ErrorText>

        <Button type="submit" loading={save.pending} disabled={!dirty && !save.pending}>
          {saved && !dirty ? (
            <>
              <Check className="size-4" aria-hidden />
              {t('profile.saved')}
            </>
          ) : save.pending ? (
            t('profile.saving')
          ) : (
            t('profile.save')
          )}
        </Button>
      </form>
    </Card>
  )
}

'use client'

import {
  Button,
  Card,
  cx,
  ErrorText,
  Field,
  inputClass,
  Segmented,
  SectionTitle,
  Skeleton,
} from '@/components/ui'
import { getApi, unwrap, writeHeaders } from '@/lib/api'
import { useI18n } from '@/lib/i18n/client'
import { useWrite } from '@/lib/use-write'
import type { Profile, UnitSystem } from '@mycoach/core/profile/contracts'
import { LOCALES, type Locale } from '@mycoach/i18n'
import { ArrowLeft, Check, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { useMe } from '../../me-context'
import { PrivacyCard } from '../privacy-card'
import { GoalSettings, ProfileSettings } from './profile-settings'

/** Everything the user can change: profile, goal, preferences, privacy and the session. */
export function SettingsView() {
  const { me } = useMe()
  const { t } = useI18n()

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link
          href="/app/profile"
          className="-ml-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm text-muted hover:text-fg"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t('nav.profile')}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          {t('settings.title')}
        </h1>
        <p className="mt-1 text-[15px] text-muted">{t('settings.description')}</p>
      </div>

      {me ? (
        <>
          <ProfileSettings profile={me.profile} />
          <GoalSettings profile={me.profile} />
          <PreferencesForm profile={me.profile} />
        </>
      ) : (
        <>
          <Skeleton className="h-96 rounded-3xl" />
          <Skeleton className="h-80 rounded-3xl" />
        </>
      )}
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

function PreferencesForm({ profile }: { profile: Profile }) {
  const { t } = useI18n()
  const { setProfile } = useMe()
  const [locale, setLocaleChoice] = useState<Locale>(profile.locale)
  const [units, setUnits] = useState<UnitSystem>(profile.units)
  const [saved, setSaved] = useState(false)

  const dirty = locale !== profile.locale || units !== profile.units

  const save = useWrite((key) =>
    unwrap(
      getApi().api.v1.me.profile.$patch(
        { json: { locale, units } },
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
      // A new language is applied app-wide by MeProvider once the profile updates.
      setProfile(result.profile)
      setSaved(true)
    }
  }

  return (
    <Card>
      <SectionTitle title={t('settings.preferences')} />
      <form onSubmit={onSubmit} className="flex flex-col gap-6">
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
            {profile.timezone.replaceAll('_', ' ')}
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
            t('settings.save')
          )}
        </Button>
      </form>
    </Card>
  )
}

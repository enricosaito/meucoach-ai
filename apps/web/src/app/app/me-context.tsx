'use client'

import { getApi, unwrap, writeHeaders } from '@/lib/api'
import { errorMessage, useI18n } from '@/lib/i18n/client'
import type { Streak } from '@mycoach/core/gamification/contracts'
import { targetsForMe, type DailyTargets } from '@mycoach/core/nutrition/contracts'
import type { Assessment, Me, Profile } from '@mycoach/core/profile/contracts'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

export type MeWithTargets = Me & { targets: DailyTargets | null; streak: Streak }

interface MeState {
  me: MeWithTargets | null
  error: string
  reload: () => void
  setProfile: (profile: Profile) => void
  setLatestAssessment: (assessment: Assessment) => void
}

const MeContext = createContext<MeState | null>(null)

/** Re-derives targets locally (same pure function as the API) after a profile or test change. */
function withTargets(me: MeWithTargets): MeWithTargets {
  return { ...me, targets: targetsForMe(me) }
}

/**
 * Loads the signed-in user once for all app screens, then:
 * 1. saves this device's time zone if it changed (streak days are local calendar days), and
 * 2. checks in today's activity, which returns the up-to-date login streak.
 */
async function loadMe(): Promise<MeWithTargets> {
  const api = getApi().api.v1.me
  let me = await unwrap(api.$get())

  const deviceTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  if (deviceTimeZone && deviceTimeZone !== me.profile.timezone) {
    const { profile } = await unwrap(
      api.profile.$patch({ json: { timezone: deviceTimeZone } }, { headers: writeHeaders() }),
    )
    me = { ...me, profile }
  }

  const { streak } = await unwrap(api['check-in'].$post({}, { headers: writeHeaders() }))
  return { ...me, streak }
}

export function MeProvider({ children }: { children: ReactNode }) {
  const { t, locale, setLocale } = useI18n()
  const [me, setMe] = useState<MeWithTargets | null>(null)
  const [error, setError] = useState('')

  const fetchMe = useCallback(() => {
    loadMe()
      .then(setMe)
      .catch((e: unknown) => {
        setError(`${t('errors.loadProfile')} ${errorMessage(t, e)}`)
      })
  }, [t])

  useEffect(fetchMe, [fetchMe])

  // The saved profile language wins over this browser's cookie, so it follows the user across
  // devices (and into the mobile app).
  const profileLocale = me?.profile.locale
  useEffect(() => {
    if (profileLocale && profileLocale !== locale) setLocale(profileLocale)
  }, [profileLocale, locale, setLocale])

  const load = useCallback(() => {
    setError('')
    fetchMe()
  }, [fetchMe])

  return (
    <MeContext.Provider
      value={{
        me,
        error,
        reload: load,
        setProfile: (profile) => {
          setMe((current) => current && withTargets({ ...current, profile }))
        },
        setLatestAssessment: (latestAssessment) => {
          setMe((current) => current && withTargets({ ...current, latestAssessment }))
        },
      }}
    >
      {children}
    </MeContext.Provider>
  )
}

export function useMe(): MeState {
  const value = useContext(MeContext)
  if (!value) throw new Error('useMe must be used inside <MeProvider>')
  return value
}

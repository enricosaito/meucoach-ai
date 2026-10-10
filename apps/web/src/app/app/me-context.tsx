'use client'

import { getApi, unwrap } from '@/lib/api'
import { errorMessage, useI18n } from '@/lib/i18n/client'
import { targetsForMe, type DailyTargets } from '@mycoach/core/nutrition/contracts'
import type { Assessment, Me, Profile } from '@mycoach/core/profile/contracts'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

export type MeWithTargets = Me & { targets: DailyTargets | null }

interface MeState {
  me: MeWithTargets | null
  error: string
  reload: () => void
  setProfile: (profile: Profile) => void
  setLatestAssessment: (assessment: Assessment) => void
}

const MeContext = createContext<MeState | null>(null)

/** Re-derives targets locally (same pure function as the API) after a profile or test change. */
function withTargets(me: Me): MeWithTargets {
  return { ...me, targets: targetsForMe(me) }
}

/** Loads `GET /me` once for all app screens and keeps it in sync after writes. */
export function MeProvider({ children }: { children: ReactNode }) {
  const { t, locale, setLocale } = useI18n()
  const [me, setMe] = useState<MeWithTargets | null>(null)
  const [error, setError] = useState('')

  const fetchMe = useCallback(() => {
    unwrap(getApi().api.v1.me.$get())
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

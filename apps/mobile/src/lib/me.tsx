import type { LevelProgress } from '@mycoach/core/gamification/contracts'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, unwrap, writeHeaders } from './api'
import { errorMessage, useI18n } from './i18n'
import { useSession } from './session'

/**
 * Loads the signed-in user once for all screens (same flow as the web app), then:
 * 1. saves this device's time zone if it changed (streak days are local calendar days), and
 * 2. checks in today's activity, which returns the up-to-date streak and level.
 */
async function loadMe() {
  let me = await unwrap(api.me.$get())
  const deviceTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  if (deviceTimeZone && deviceTimeZone !== me.profile.timezone) {
    const { profile } = await unwrap(
      api.me.profile.$patch({ json: { timezone: deviceTimeZone } }, { headers: writeHeaders() }),
    )
    me = { ...me, profile }
  }
  const { streak, level } = await unwrap(api.me['check-in'].$post({}, { headers: writeHeaders() }))
  return { ...me, streak, level }
}

export type Me = Awaited<ReturnType<typeof loadMe>>

interface MeState {
  me: Me | null
  error: string
  reload: () => Promise<void>
  setLevel: (level: LevelProgress) => void
}

const MeContext = createContext<MeState | null>(null)

export function MeProvider({ children }: { children: ReactNode }) {
  const { session } = useSession()
  const { t, locale, setLocale } = useI18n()
  const [me, setMe] = useState<Me | null>(null)
  const [error, setError] = useState('')
  const userId = session?.user.id

  const reload = useCallback(async () => {
    if (!userId) return
    try {
      setMe(await loadMe())
      setError('')
    } catch (e) {
      setError(errorMessage(t, e))
    }
  }, [userId, t])

  useEffect(() => {
    setMe(null)
    void reload()
  }, [reload])

  // The saved profile language wins, so it follows the user across devices.
  const profileLocale = me?.profile.locale
  useEffect(() => {
    if (profileLocale && profileLocale !== locale) setLocale(profileLocale)
  }, [profileLocale, locale, setLocale])

  return (
    <MeContext.Provider
      value={{
        me,
        error,
        reload,
        setLevel: (level) => {
          setMe((current) => current && { ...current, level })
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

'use client'

import { getApi, unwrap } from '@/lib/api'
import type { Assessment, Me, Profile } from '@mycoach/core/profile/contracts'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

interface MeState {
  me: Me | null
  error: string
  reload: () => void
  setProfile: (profile: Profile) => void
  setLatestAssessment: (assessment: Assessment) => void
}

const MeContext = createContext<MeState | null>(null)

/** Loads `GET /me` once for all app screens and keeps it in sync after writes. */
export function MeProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null)
  const [error, setError] = useState('')

  const fetchMe = useCallback(() => {
    unwrap(getApi().api.v1.me.$get())
      .then(setMe)
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Could not load your profile')
      })
  }, [])

  useEffect(fetchMe, [fetchMe])

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
          setMe((current) => current && { ...current, profile })
        },
        setLatestAssessment: (latestAssessment) => {
          setMe((current) => current && { ...current, latestAssessment })
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

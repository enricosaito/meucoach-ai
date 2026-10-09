'use client'

import { ErrorText } from '@/components/ui'
import { getApi, unwrap } from '@/lib/api'
import type { Assessment, Me, Profile } from '@mycoach/core/profile/contracts'
import { useEffect, useState } from 'react'
import { AssessmentCard } from './assessment-card'
import { ChatCard } from './chat-card'
import { ProfileCard } from './profile-card'

export function Dashboard() {
  const [me, setMe] = useState<Me | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    unwrap(getApi().api.v1.me.$get())
      .then(setMe)
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Could not load your profile')
      })
  }, [])

  if (error) return <ErrorText>{error}</ErrorText>
  if (!me) return <p className="text-sm text-slate-500">Loading…</p>

  return (
    <>
      <ProfileCard
        profile={me.profile}
        onSaved={(profile: Profile) => {
          setMe({ ...me, profile })
        }}
      />
      <AssessmentCard
        units={me.profile.units}
        latest={me.latestAssessment}
        onSaved={(latestAssessment: Assessment) => {
          setMe({ ...me, latestAssessment })
        }}
      />
      <ChatCard />
    </>
  )
}

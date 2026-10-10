'use client'

import { useMe } from '@/app/app/me-context'
import { localDay } from '@mycoach/core/gamification/contracts'
import {
  todayWorkout,
  type TodayWorkout,
  type WorkoutPlanRecord,
  type WorkoutSession,
} from '@mycoach/core/training/contracts'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getApi, newIdempotencyKey, unwrap, writeHeaders } from './api'
import { errorMessage, useI18n } from './i18n/client'
import { fetchRecentSessions } from './training-data'

export interface XpFeedback {
  awarded: number
  leveledUp: boolean
  level: number
}

/**
 * Completed workouts for the ready plan: which day is today's, which days are done today, and
 * marking a day as done (through the API, which also grants XP).
 */
export function useWorkoutLog(ready: WorkoutPlanRecord | null) {
  const { t } = useI18n()
  const { me, setLevel } = useMe()
  const [sessions, setSessions] = useState<WorkoutSession[] | null>(null)
  const [pendingDay, setPendingDay] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState<XpFeedback | null>(null)
  // One idempotency key per day being logged, reused if the user retries after a failure.
  const keys = useRef(new Map<number, string>())

  useEffect(() => {
    fetchRecentSessions()
      .then(setSessions)
      .catch(() => {
        setSessions([])
      })
  }, [])

  // Captured once per mount: rendering must stay pure.
  const [now] = useState(() => new Date())
  const today = localDay(now, me?.profile.timezone ?? 'UTC')
  const planId = ready?.id ?? null
  const dayCount = ready?.plan?.days.length ?? 0

  const workout: TodayWorkout | null =
    planId && sessions ? todayWorkout(planId, dayCount, sessions, today) : null
  const doneToday = new Set(
    (sessions ?? [])
      .filter((s) => s.planId === planId && s.localDate === today)
      .map((s) => s.dayIndex),
  )

  const logDay = useCallback(
    async (dayIndex: number) => {
      if (!planId) return
      const key = keys.current.get(dayIndex) ?? newIdempotencyKey()
      keys.current.set(dayIndex, key)
      setPendingDay(dayIndex)
      setError('')
      try {
        const { session, xp } = await unwrap(
          getApi().api.v1.training.workouts.$post(
            { json: { planId, dayIndex } },
            { headers: writeHeaders(key) },
          ),
        )
        keys.current.delete(dayIndex)
        setSessions((current) => [session, ...(current ?? []).filter((s) => s.id !== session.id)])
        setLevel(xp.progress)
        setFeedback({ awarded: xp.awarded, leveledUp: xp.leveledUp, level: xp.progress.level })
      } catch (e) {
        setError(errorMessage(t, e))
      } finally {
        setPendingDay(null)
      }
    },
    [planId, setLevel, t],
  )

  return {
    loading: sessions === null,
    today: workout,
    doneToday,
    logDay,
    pendingDay,
    error,
    feedback,
  }
}

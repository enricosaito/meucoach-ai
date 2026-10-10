import { localDay } from '@mycoach/core/gamification/contracts'
import {
  todayWorkout,
  type WorkoutPlanRecord,
  type WorkoutSession,
} from '@mycoach/core/training/contracts'
import { useCallback, useEffect, useRef, useState } from 'react'
import { api, newIdempotencyKey, unwrap, writeHeaders } from './api'
import { fetchRecentSessions } from './data'
import { errorMessage, useI18n } from './i18n'
import { useMe } from './me'

export interface XpFeedback {
  awarded: number
  leveledUp: boolean
  level: number
}

/** Today's workout for the ready plan, and marking a day as done (the API also grants XP). */
export function useWorkoutLog(ready: WorkoutPlanRecord | null) {
  const { t } = useI18n()
  const { me, setLevel } = useMe()
  const [sessions, setSessions] = useState<WorkoutSession[] | null>(null)
  const [pendingDay, setPendingDay] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState<XpFeedback | null>(null)
  // One idempotency key per day being logged, reused if the user retries after a failure.
  const keys = useRef(new Map<number, string>())

  const reload = useCallback(async () => {
    setSessions(await fetchRecentSessions().catch(() => []))
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const today = localDay(new Date(), me?.profile.timezone ?? 'UTC')
  const planId = ready?.id ?? null
  const dayCount = ready?.plan?.days.length ?? 0
  const workout = planId && sessions ? todayWorkout(planId, dayCount, sessions, today) : null

  const logDay = useCallback(
    async (dayIndex: number) => {
      if (!planId) return
      const key = keys.current.get(dayIndex) ?? newIdempotencyKey()
      keys.current.set(dayIndex, key)
      setPendingDay(dayIndex)
      setError('')
      try {
        const { session, xp } = await unwrap(
          api.training.workouts.$post(
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

  return { loading: sessions === null, today: workout, logDay, pendingDay, error, feedback, reload }
}

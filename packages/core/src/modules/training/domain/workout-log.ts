/**
 * "Today's workout" from the append-only log of completed sessions. Pure, so web, mobile and the
 * API derive the same answer from the same rows.
 */

export interface WorkoutSession {
  id: string
  planId: string
  dayIndex: number
  dayTitle: string
  /** Local calendar day the workout was done ("YYYY-MM-DD"). */
  localDate: string
  createdAt: string
}

export interface WorkoutSessionRowLike {
  id: string
  plan_id: string
  day_index: number
  day_title: string
  local_date: string
  created_at: string
}

export function toWorkoutSession(row: WorkoutSessionRowLike): WorkoutSession {
  return {
    id: row.id,
    planId: row.plan_id,
    dayIndex: row.day_index,
    dayTitle: row.day_title,
    localDate: row.local_date,
    createdAt: row.created_at,
  }
}

export interface TodayWorkout {
  /** The plan day to show today: the one done today, or the next one in the rotation. */
  dayIndex: number
  doneToday: boolean
  /** Workouts in the last 7 local days, today included (any plan). */
  thisWeek: number
}

const DAY_MS = 24 * 60 * 60 * 1000
const epochDay = (day: string) => Math.round(Date.parse(`${day}T00:00:00Z`) / DAY_MS)

/**
 * Plans rotate through their days in order: after day N comes day N+1, wrapping to the first.
 * The rotation follows the latest session of THIS plan, so a new plan starts at its first day.
 */
export function todayWorkout(
  planId: string,
  dayCount: number,
  sessions: readonly WorkoutSession[],
  today: string,
): TodayWorkout {
  const todayEpoch = epochDay(today)
  const thisWeek = sessions.filter((s) => {
    const diff = todayEpoch - epochDay(s.localDate)
    return diff >= 0 && diff < 7
  }).length

  if (dayCount <= 0) return { dayIndex: 0, doneToday: false, thisWeek }

  const latest = sessions
    .filter((s) => s.planId === planId && s.dayIndex < dayCount)
    .reduce<WorkoutSession | null>(
      (best, s) =>
        !best ||
        s.localDate > best.localDate ||
        (s.localDate === best.localDate && s.createdAt > best.createdAt)
          ? s
          : best,
      null,
    )

  if (!latest) return { dayIndex: 0, doneToday: false, thisWeek }
  if (latest.localDate === today) return { dayIndex: latest.dayIndex, doneToday: true, thisWeek }
  return { dayIndex: (latest.dayIndex + 1) % dayCount, doneToday: false, thisWeek }
}

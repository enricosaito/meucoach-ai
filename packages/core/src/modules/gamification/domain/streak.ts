/**
 * Daily streaks from an append-only list of active days (local calendar days, "YYYY-MM-DD").
 * Pure: the same days and "today" always give the same result, so streaks can be recomputed
 * from the log at any time.
 */

export interface Streak {
  /** Consecutive active days ending today, or ending yesterday if today isn't logged yet. */
  current: number
  longest: number
  activeToday: boolean
  lastActiveDay: string | null
}

const DAY_MS = 24 * 60 * 60 * 1000
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/

/** The calendar day ("YYYY-MM-DD") at `instant` in an IANA time zone. Falls back to UTC. */
export function localDay(instant: Date, timeZone: string): string {
  try {
    // en-CA formats dates as YYYY-MM-DD.
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(instant)
  } catch {
    return instant.toISOString().slice(0, 10)
  }
}

function toEpochDay(day: string): number {
  return Math.round(Date.parse(`${day}T00:00:00Z`) / DAY_MS)
}

export function addDays(day: string, delta: number): string {
  return new Date((toEpochDay(day) + delta) * DAY_MS).toISOString().slice(0, 10)
}

export function computeStreak(days: readonly string[], today: string): Streak {
  const epochDays = [...new Set(days.filter((d) => ISO_DAY.test(d)).map(toEpochDay))]
    .filter((d) => d <= toEpochDay(today)) // ignore anything logged "in the future"
    .sort((a, b) => a - b)

  if (epochDays.length === 0) {
    return { current: 0, longest: 0, activeToday: false, lastActiveDay: null }
  }

  let longest = 1
  let run = 1
  for (let i = 1; i < epochDays.length; i++) {
    run = (epochDays[i] ?? 0) - (epochDays[i - 1] ?? 0) === 1 ? run + 1 : 1
    longest = Math.max(longest, run)
  }

  const last = epochDays[epochDays.length - 1] ?? 0
  const todayEpoch = toEpochDay(today)
  // `run` now holds the length of the run that ends at `last`.
  const current = todayEpoch - last <= 1 ? run : 0

  return {
    current,
    longest,
    activeToday: last === todayEpoch,
    lastActiveDay: new Date(last * DAY_MS).toISOString().slice(0, 10),
  }
}

/** Streak lengths worth celebrating: early wins first, then the habit-forming marks. */
export const STREAK_MILESTONES = [1, 3, 7, 14, 30, 60, 100, 180, 365] as const

export function isStreakMilestone(days: number): boolean {
  return (STREAK_MILESTONES as readonly number[]).includes(days)
}

/** The next milestone after `days`, or null past the last one. */
export function nextStreakMilestone(days: number): number | null {
  return STREAK_MILESTONES.find((m) => m > days) ?? null
}

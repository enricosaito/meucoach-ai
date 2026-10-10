import type { AdminClient } from '../../shared'
import { insertActivityDay, listActivityDays } from './data/activity-repository'
import { addDays, computeStreak, localDay, type Streak } from './domain/streak'

/** How far back streaks look. Longer streaks than this are capped (fine for display). */
const LOOKBACK_DAYS = 400

export function createGamificationService(deps: { db: AdminClient; now?: () => Date }) {
  const { db } = deps
  const now = deps.now ?? (() => new Date())

  async function getStreak(userId: string, timeZone: string): Promise<Streak> {
    const today = localDay(now(), timeZone)
    const days = await listActivityDays(db, userId, addDays(today, -LOOKBACK_DAYS))
    return computeStreak(days, today)
  }

  return {
    getStreak,

    /**
     * Records that the user was active today (in their time zone) and returns the updated streak.
     * Safe to call on every app open: one row per day at most.
     */
    async checkIn(userId: string, timeZone: string): Promise<Streak> {
      await insertActivityDay(db, userId, localDay(now(), timeZone))
      return getStreak(userId, timeZone)
    },
  }
}

export type GamificationService = ReturnType<typeof createGamificationService>

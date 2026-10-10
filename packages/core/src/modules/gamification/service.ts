import type { AdminClient } from '../../shared'
import { insertActivityDay, listActivityDays } from './data/activity-repository'
import { getXpTotal, insertXpEvent } from './data/xp-repository'
import {
  levelProgress,
  XP_AMOUNTS,
  xpSource,
  type LevelProgress,
  type XpReason,
} from './domain/levels'
import { addDays, computeStreak, localDay, type Streak } from './domain/streak'

/** How far back streaks look. Longer streaks than this are capped (fine for display). */
const LOOKBACK_DAYS = 400

export interface XpAward {
  /** XP granted by this call: 0 when it was already earned (same day, retry…). */
  awarded: number
  progress: LevelProgress
  leveledUp: boolean
}

export function createGamificationService(deps: { db: AdminClient; now?: () => Date }) {
  const { db } = deps
  const now = deps.now ?? (() => new Date())

  async function getStreak(userId: string, timeZone: string): Promise<Streak> {
    const today = localDay(now(), timeZone)
    const days = await listActivityDays(db, userId, addDays(today, -LOOKBACK_DAYS))
    return computeStreak(days, today)
  }

  async function getLevel(userId: string): Promise<LevelProgress> {
    return levelProgress(await getXpTotal(db, userId))
  }

  /**
   * Grants the XP for `reason` once per source window (see `xpSource`), in the user's time zone.
   * Safe to call on every retry.
   */
  async function awardXp(userId: string, reason: XpReason, timeZone: string): Promise<XpAward> {
    const amount = XP_AMOUNTS[reason]
    const source = xpSource(reason, localDay(now(), timeZone))
    const created = await insertXpEvent(db, { userId, reason, source, amount })
    const progress = await getLevel(userId)
    const awarded = created ? amount : 0
    return {
      awarded,
      progress,
      leveledUp: awarded > 0 && levelProgress(progress.totalXp - awarded).level < progress.level,
    }
  }

  return {
    getStreak,
    getLevel,
    awardXp,

    /**
     * Records that the user was active today (in their time zone), grants the daily XP and returns
     * the updated streak and level. Safe to call on every app open: one row per day at most.
     */
    async checkIn(
      userId: string,
      timeZone: string,
    ): Promise<{ streak: Streak; level: LevelProgress }> {
      await insertActivityDay(db, userId, localDay(now(), timeZone))
      const [streak, award] = await Promise.all([
        getStreak(userId, timeZone),
        awardXp(userId, 'daily_check_in', timeZone),
      ])
      return { streak, level: award.progress }
    },
  }
}

export type GamificationService = ReturnType<typeof createGamificationService>

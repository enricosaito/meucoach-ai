/**
 * XP rules and the level curve. Pure: levels are always derived from the XP total, so the curve
 * can change without migrating data.
 */

export const XP_REASONS = ['workout_logged', 'daily_check_in', 'energy_test'] as const
export type XpReason = (typeof XP_REASONS)[number]

/** XP per reason. Each award is also capped by its source key (see `xpSource`). */
export const XP_AMOUNTS: Record<XpReason, number> = {
  workout_logged: 50,
  daily_check_in: 5,
  energy_test: 20,
}

/**
 * The source key makes awards idempotent and caps how often they can be earned:
 * workouts and check-ins once per local day, the energy test once per month.
 */
export function xpSource(reason: XpReason, localDay: string): string {
  return reason === 'energy_test' ? localDay.slice(0, 7) : localDay
}

/** Total XP needed to reach `level` (level 1 starts at 0): 0, 100, 300, 600, 1000, … */
export function xpForLevel(level: number): number {
  const n = Math.max(1, Math.floor(level))
  return 50 * n * (n - 1)
}

export interface LevelProgress {
  level: number
  totalXp: number
  /** XP earned inside the current level. */
  levelXp: number
  /** XP the current level spans (from its start to the next level). */
  levelSpan: number
}

export function levelProgress(totalXp: number): LevelProgress {
  const xp = Math.max(0, Math.floor(totalXp))
  // Invert 50·n·(n−1) ≤ xp, then correct for floating point at the boundaries.
  let level = Math.max(1, Math.floor((1 + Math.sqrt(1 + (4 * xp) / 50)) / 2))
  while (xpForLevel(level + 1) <= xp) level++
  while (level > 1 && xpForLevel(level) > xp) level--
  const start = xpForLevel(level)
  return { level, totalXp: xp, levelXp: xp - start, levelSpan: xpForLevel(level + 1) - start }
}

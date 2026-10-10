// Client-safe public API of the gamification module: pure streak and level logic and types.
export { addDays, computeStreak, localDay, type Streak } from './domain/streak'
export {
  levelProgress,
  XP_AMOUNTS,
  XP_REASONS,
  xpForLevel,
  xpSource,
  type LevelProgress,
  type XpReason,
} from './domain/levels'

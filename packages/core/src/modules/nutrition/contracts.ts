// Client-safe public API of the nutrition module: pure target calculations and types.
import type { Me } from '../profile/contracts'
import { computeDailyTargets, type DailyTargets } from './domain/targets'

export {
  TARGETS_FORMULA_VERSION,
  computeDailyTargets,
  referenceWeightKg,
  type DailyTargets,
  type TargetsInput,
} from './domain/targets'

/** Targets for a user, or null until they have taken the energy test. */
export function targetsForMe(me: Pick<Me, 'profile' | 'latestAssessment'>): DailyTargets | null {
  const a = me.latestAssessment
  if (!a) return null
  return computeDailyTargets({
    goal: me.profile.goals.primary,
    sex: a.sex,
    weightKg: a.weightKg,
    heightCm: a.heightCm,
    bmrKcal: a.bmrKcal,
    tdeeKcal: a.tdeeKcal,
  })
}

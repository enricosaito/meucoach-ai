// Client-safe public API of the nutrition module: targets, diet schemas, types and pure functions.
import type { Me } from '../profile/contracts'
import { computeDailyTargets, type DailyTargets } from './domain/targets'

export {
  TARGETS_FORMULA_VERSION,
  computeDailyTargets,
  referenceWeightKg,
  type DailyTargets,
  type TargetsInput,
} from './domain/targets'
export {
  BUDGETS,
  COOKING_TIMES,
  DIET_STYLES,
  DIET_TEXT_MAX_LENGTH,
  MEAL_TYPES,
  MEALS_PER_DAY,
  dietPlanSchema,
  dietQuestionnaireSchema,
  requestDietPlanSchema,
  type Budget,
  type CookingTime,
  type DietPlan,
  type DietQuestionnaire,
  type DietStyle,
  type Food,
  type Meal,
  type MealOption,
  type MealsPerDay,
  type MealType,
  type RequestDietPlanInput,
} from './schemas'
export {
  MEAL_SPLITS,
  dayTotals,
  foodKcal,
  optionTotals,
  planTotals,
  sumMacros,
  type MacroTotals,
} from './domain/meals'
export {
  toDietPlanRecord,
  toDietQuestionnaire,
  type DietPlanRowLike,
  type DietProfileRowLike,
} from './domain/mappers'
export {
  DIET_PLAN_STATUSES,
  type DietInputs,
  type DietPlanRecord,
  type DietPlanStatus,
} from './types'

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

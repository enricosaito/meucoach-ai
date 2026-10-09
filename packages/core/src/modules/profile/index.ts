// Public API of the profile module. Other modules and packages may import ONLY from here.
export {
  ACTIVITY_LEVELS,
  ACTIVITY_MULTIPLIERS,
  SEXES,
  estimateEnergyExpenditure,
  type ActivityLevel,
  type EnergyEstimate,
  type Sex,
} from './domain/mifflin-st-jeor'
export { UNIT_SYSTEMS, feetInchesToCm, poundsToKg, type UnitSystem } from './domain/units'
export {
  GOAL_TYPES,
  assessmentInputSchema,
  goalsSchema,
  updateProfileSchema,
  type AssessmentInput,
  type Goals,
  type UpdateProfileInput,
} from './schemas'
export {
  createProfileService,
  type Assessment,
  type CoachingContext,
  type Me,
  type Profile,
  type ProfileService,
} from './service'

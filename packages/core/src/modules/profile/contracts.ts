// Client-safe public API of the profile module: schemas, constants, DTO types and pure functions.
// No data access or server-only dependencies, so web and mobile clients may import it.
export {
  ACTIVITY_LEVELS,
  ACTIVITY_MULTIPLIERS,
  MIFFLIN_ST_JEOR_FORMULA_VERSION,
  SEXES,
  estimateEnergyExpenditure,
  type ActivityLevel,
  type EnergyEstimate,
  type Sex,
} from './domain/mifflin-st-jeor'
export {
  UNIT_SYSTEMS,
  cmToFeetInches,
  feetInchesToCm,
  kgToPounds,
  poundsToKg,
  type UnitSystem,
} from './domain/units'
export {
  CONSENT_KINDS,
  CONSENT_VERSIONS,
  GOAL_TYPES,
  assessmentInputSchema,
  grantConsentSchema,
  goalsSchema,
  updateProfileSchema,
  type AssessmentInput,
  type ConsentKind,
  type Goals,
  type UpdateProfileInput,
} from './schemas'
export type { Assessment, CoachingContext, Me, Profile } from './types'

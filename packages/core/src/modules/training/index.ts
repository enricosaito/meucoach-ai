// Public API of the training module (server side). Other modules and packages may import ONLY from
// here or from `contracts.ts` (the client-safe subset).
export * from './contracts'
export { BODY_PHOTOS_BUCKET } from './data/photo-storage'
export {
  BODY_ANALYSIS_FEATURE,
  MAX_PLANS_PER_DAY,
  WORKOUT_PLAN_FEATURE,
  createTrainingService,
  type TrainingService,
} from './service'

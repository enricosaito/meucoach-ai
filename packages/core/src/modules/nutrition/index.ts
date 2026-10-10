// Public API of the nutrition module (server side). Other modules and packages may import ONLY from
// here or from `contracts.ts` (the client-safe subset).
export * from './contracts'
export {
  DIET_PLAN_FEATURE,
  MAX_DIET_PLANS_PER_DAY,
  createNutritionService,
  type NutritionService,
} from './service'

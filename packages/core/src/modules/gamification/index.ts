// Public API of the gamification module (server side). Other modules and packages may import ONLY
// from here or from `contracts.ts` (the client-safe subset).
export * from './contracts'
export { createGamificationService, type GamificationService, type XpAward } from './service'

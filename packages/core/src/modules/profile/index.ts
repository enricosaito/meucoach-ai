// Public API of the profile module (server side). Other modules and packages may import ONLY from
// here or from `contracts.ts` (the client-safe subset).
export * from './contracts'
export { createProfileService, type ProfileService } from './service'

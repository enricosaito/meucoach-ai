// Public API of the coaching module (server side). Other modules and packages may import ONLY from
// here or from `contracts.ts` (the client-safe subset).
// All AI calls in the codebase go through the gateway exported below.
export * from './contracts'
export {
  createAiGateway,
  type AiCallRecord,
  type AiCallRecorder,
  type AiGateway,
} from './ai/gateway'
export { DEFAULT_ANTHROPIC_MODEL } from './ai/providers/anthropic'
export {
  AI_PROVIDER_NAMES,
  createAiProvider,
  type AiProviderConfig,
  type AiProviderName,
} from './ai/registry'
export type { AiProvider, ChatTurn } from './ai/types'
export { createAiCallRecorder } from './data/ai-calls-repository'
export { COACH_CHAT_FEATURE, createCoachingService, type CoachingService } from './service'

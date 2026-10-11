// Public API of the coaching module (server side). Other modules and packages may import ONLY from
// here or from `contracts.ts` (the client-safe subset).
// All AI calls in the codebase go through the gateway exported below.
export * from './contracts'
export {
  createAiGateway,
  type AiCallRecord,
  type AiCallRecorder,
  type AiGateway,
  type GatewayStructuredInput,
  type GatewayStructuredResult,
} from './ai/gateway'
export {
  AI_MODEL_TIERS,
  AI_PROVIDER_NAMES,
  DEFAULT_MODELS,
  createAiProvider,
  type AiModelTier,
  type AiProviderConfig,
  type AiProviderName,
} from './ai/registry'
export type { AiProvider, ChatTurn, ContentPart, ImageMediaType } from './ai/types'
export { createAiCallRecorder } from './data/ai-calls-repository'
export {
  COACH_CHAT_FEATURE,
  COACH_CHECK_IN_FEATURE,
  VOICE_TRANSCRIPTION_FEATURE,
  createCoachingService,
  type CoachingService,
} from './service'
export {
  DEFAULT_TRANSCRIPTION_MODEL,
  TRANSCRIPTION_PROVIDER_NAMES,
  createTranscriber,
  type TranscriptionProvider,
  type TranscriptionProviderName,
} from './ai/transcription'

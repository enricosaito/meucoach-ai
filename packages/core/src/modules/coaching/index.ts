// Public API of the coaching module. Other modules and packages may import ONLY from here.
// All AI calls in the codebase go through the gateway exported below.
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
export {
  CHAT_MESSAGE_MAX_LENGTH,
  sendChatMessageSchema,
  type SendChatMessageInput,
} from './schemas'
export {
  COACH_CHAT_FEATURE,
  createCoachingService,
  type ChatMessage,
  type CoachingService,
} from './service'

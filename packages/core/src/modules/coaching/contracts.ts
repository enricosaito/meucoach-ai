// Client-safe public API of the coaching module. No AI SDKs or data access.
export {
  CHAT_MESSAGE_MAX_LENGTH,
  sendChatMessageSchema,
  type SendChatMessageInput,
} from './schemas'
export type { ChatMessage } from './types'
export { parseChatMarkdown, type ChatBlock, type ChatSpan } from './domain/chat-format'

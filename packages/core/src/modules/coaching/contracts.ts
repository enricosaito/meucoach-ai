// Client-safe public API of the coaching module. No AI SDKs or data access.
export {
  CHAT_IMAGE_MAX_BASE64,
  CHAT_IMAGE_TYPES,
  CHAT_MESSAGE_MAX_LENGTH,
  chatImageSchema,
  sendChatMessageSchema,
  type ChatImage,
  type SendChatMessageInput,
} from './schemas'
export type { ChatMessage, CheckIn } from './types'
export { parseChatMarkdown, type ChatBlock, type ChatSpan } from './domain/chat-format'

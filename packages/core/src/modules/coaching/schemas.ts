import { z } from 'zod'

export const CHAT_MESSAGE_MAX_LENGTH = 2000

export const sendChatMessageSchema = z.strictObject({
  content: z.string().trim().min(1).max(CHAT_MESSAGE_MAX_LENGTH),
})
export type SendChatMessageInput = z.infer<typeof sendChatMessageSchema>

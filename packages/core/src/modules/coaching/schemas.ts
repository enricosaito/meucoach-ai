import { z } from 'zod'

export const CHAT_MESSAGE_MAX_LENGTH = 2000

export const CHAT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
/**
 * Base64 length cap for a chat photo (~2.2 MB of image). The app sends ~1280 px JPEGs of a few
 * hundred KB; the cap keeps the whole request under the 4.5 MB serverless body limit.
 */
export const CHAT_IMAGE_MAX_BASE64 = 3_000_000

export const chatImageSchema = z.strictObject({
  mediaType: z.enum(CHAT_IMAGE_TYPES),
  base64: z
    .string()
    .min(1)
    .max(CHAT_IMAGE_MAX_BASE64)
    .regex(/^[A-Za-z0-9+/]+={0,2}$/, 'Not base64'),
})
export type ChatImage = z.infer<typeof chatImageSchema>

/** A message to the coach: text, a photo (analyzed for this reply, never stored), or both. */
export const sendChatMessageSchema = z
  .strictObject({
    content: z.string().trim().max(CHAT_MESSAGE_MAX_LENGTH).default(''),
    image: chatImageSchema.optional(),
  })
  .refine((input) => input.content.length > 0 || input.image !== undefined, {
    message: 'Write a message or attach a photo',
    path: ['content'],
  })
export type SendChatMessageInput = z.infer<typeof sendChatMessageSchema>

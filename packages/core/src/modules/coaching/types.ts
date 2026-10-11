export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  /** The user attached a photo (not stored: the app shows its local copy, if it has one). */
  hasImage: boolean
  /** The content is the transcript of a voice note. */
  viaVoice: boolean
}

/** Today's coach check-in: a message in the chat thread plus one-tap replies. */
export interface CheckIn {
  message: ChatMessage
  quickReplies: string[]
}

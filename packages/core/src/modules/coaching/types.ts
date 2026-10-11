export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

/** Today's coach check-in: a message in the chat thread plus one-tap replies. */
export interface CheckIn {
  message: ChatMessage
  quickReplies: string[]
}

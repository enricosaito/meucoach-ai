import type { AdminClient } from '../../shared'
import type { ProfileService } from '../profile'
import type { AiGateway } from './ai/gateway'
import { insertExchange, listRecentMessages, type ChatMessageRow } from './data/chat-repository'
import { MAX_HISTORY_TURNS, buildChatWindow } from './domain/chat-window'
import { coachChat } from './prompts'

export const COACH_CHAT_FEATURE = 'coach_chat'
const MAX_REPLY_TOKENS = 16000
const REFUSAL_REPLY =
  "I can't help with that one. Try asking about training, nutrition, sleep or habits."

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

function toChatMessage(row: ChatMessageRow): ChatMessage {
  return {
    id: row.id,
    role: row.role as ChatMessage['role'],
    content: row.content,
    createdAt: row.created_at,
  }
}

export function createCoachingService(deps: {
  db: AdminClient
  gateway: AiGateway
  profile: Pick<ProfileService, 'getCoachingContext'>
  now?: () => Date
}) {
  const { db, gateway, profile } = deps
  const now = deps.now ?? (() => new Date())

  return {
    /**
     * Answers a question. Nothing is persisted unless the AI call succeeds, and the question and
     * reply are stored together, so a failed request can be retried without duplicates.
     */
    async sendMessage(
      userId: string,
      content: string,
      options: { requestId?: string } = {},
    ): Promise<{ question: ChatMessage; reply: ChatMessage }> {
      const askedAt = now()
      const [context, history] = await Promise.all([
        profile.getCoachingContext(userId),
        listRecentMessages(db, userId, MAX_HISTORY_TURNS),
      ])

      const result = await gateway.chat({
        userId,
        feature: COACH_CHAT_FEATURE,
        promptVersion: coachChat.version,
        requestId: options.requestId,
        request: {
          system: coachChat.buildSystemPrompt(context),
          messages: buildChatWindow(
            history.map((row) => ({ role: row.role as ChatMessage['role'], content: row.content })),
            content,
          ),
          maxTokens: MAX_REPLY_TOKENS,
        },
      })

      const replyText = result.refused || result.text.length === 0 ? REFUSAL_REPLY : result.text
      const answeredAt = new Date(Math.max(now().getTime(), askedAt.getTime() + 1))
      const [question, reply] = await insertExchange(db, [
        { user_id: userId, role: 'user', content, created_at: askedAt.toISOString() },
        {
          user_id: userId,
          role: 'assistant',
          content: replyText,
          ai_call_id: result.aiCallId,
          prompt_version: coachChat.version,
          created_at: answeredAt.toISOString(),
        },
      ])
      return { question: toChatMessage(question), reply: toChatMessage(reply) }
    },
  }
}

export type CoachingService = ReturnType<typeof createCoachingService>

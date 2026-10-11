import { AppError, noopLogger, type AdminClient, type Logger } from '../../shared'
import { addDays, localDay, type GamificationService } from '../gamification'
import type { ProfileService } from '../profile'
import type { TrainingService } from '../training'
import type { AiGateway } from './ai/gateway'
import {
  findCheckIn,
  insertCheckIn,
  insertExchange,
  listRecentMessages,
  type ChatMessageRow,
} from './data/chat-repository'
import { buildCheckInFacts, fallbackCheckIn, type CheckInDraft } from './domain/check-in'
import { MAX_HISTORY_TURNS, buildChatWindow } from './domain/chat-window'
import { coachChat, coachCheckIn } from './prompts'
import type { ChatMessage, CheckIn } from './types'

export const COACH_CHAT_FEATURE = 'coach_chat'
export const COACH_CHECK_IN_FEATURE = 'coach_check_in'
/** How far back the check-in looks at workouts (also covers the current week). */
const CHECK_IN_LOOKBACK_DAYS = 14
const CHECK_IN_MAX_CHARS = 600
const QUICK_REPLY_MAX_CHARS = 40
const MAX_REPLY_TOKENS = 16000
const REFUSAL_REPLY =
  "I can't help with that one. Try asking about training, nutrition, sleep or habits."

function toChatMessage(row: ChatMessageRow): ChatMessage {
  return {
    id: row.id,
    role: row.role as ChatMessage['role'],
    content: row.content,
    createdAt: row.created_at,
  }
}

/** Keeps the AI's draft within what the UI and the table allow; falls back when it's empty. */
function cleanDraft(draft: CheckInDraft | null, fallback: CheckInDraft): CheckInDraft {
  const message = draft?.message.trim().slice(0, CHECK_IN_MAX_CHARS) ?? ''
  const quickReplies = (draft?.quickReplies ?? [])
    .map((r) => r.trim().slice(0, QUICK_REPLY_MAX_CHARS))
    .filter(Boolean)
    .slice(0, 3)
  if (!message) return fallback
  return { message, quickReplies: quickReplies.length > 0 ? quickReplies : fallback.quickReplies }
}

export function createCoachingService(deps: {
  db: AdminClient
  gateway: AiGateway
  profile: Pick<ProfileService, 'getCoachingContext'>
  training: Pick<TrainingService, 'getCoachSnapshot'>
  gamification: Pick<GamificationService, 'getStreak'>
  logger?: Logger
  now?: () => Date
}) {
  const { db, gateway, profile, training, gamification } = deps
  const logger = deps.logger ?? noopLogger
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

    /**
     * Today's check-in: written once per local day (the first open), then reused. The coach
     * draws on yesterday's and today's workout, a break, limitations and the recent chat. If
     * the AI is unavailable, a template check-in is stored instead, so Home never stays empty.
     */
    async getDailyCheckIn(userId: string, options: { requestId?: string } = {}): Promise<CheckIn> {
      const context = await profile.getCoachingContext(userId)
      const today = localDay(now(), context.timezone)
      const existing = await findCheckIn(db, userId, today)
      if (existing) return toCheckIn(existing)

      const [snapshot, streak, history] = await Promise.all([
        training.getCoachSnapshot(userId, addDays(today, -CHECK_IN_LOOKBACK_DAYS)),
        gamification.getStreak(userId, context.timezone),
        listRecentMessages(db, userId, 6),
      ])
      const facts = buildCheckInFacts({
        context,
        snapshot,
        streak,
        recentChat: history.map((row) => ({
          role: row.role === 'assistant' ? 'assistant' : 'user',
          content: row.content,
        })),
        today,
      })
      const fallback = fallbackCheckIn(facts)

      let draft = fallback
      let aiCallId: string | null = null
      let promptVersion: string | null = null
      try {
        const result = await gateway.structured({
          userId,
          feature: COACH_CHECK_IN_FEATURE,
          promptVersion: coachCheckIn.version,
          requestId: options.requestId,
          system: coachCheckIn.buildSystemPrompt(context, { now: now() }),
          content: [{ type: 'text', text: coachCheckIn.buildUserContent(facts) }],
          schema: coachCheckIn.checkInOutputSchema,
          maxTokens: 2000,
          effort: 'low',
          mock: () => fallback,
        })
        draft = cleanDraft(result.refused ? null : result.data, fallback)
        aiCallId = result.aiCallId
        promptVersion = coachCheckIn.version
      } catch (error) {
        // The gateway already logged and recorded the failed call; the template keeps Home warm.
        if (!(error instanceof AppError)) throw error
        logger.warn({ err: error, requestId: options.requestId }, 'check-in fell back to template')
      }

      const row = await insertCheckIn(db, {
        user_id: userId,
        role: 'assistant',
        content: draft.message,
        quick_replies: draft.quickReplies,
        local_date: today,
        ai_call_id: aiCallId,
        prompt_version: promptVersion,
      })
      return toCheckIn(row)
    },
  }
}

function toCheckIn(row: ChatMessageRow): CheckIn {
  return { message: toChatMessage(row), quickReplies: row.quick_replies ?? [] }
}

export type CoachingService = ReturnType<typeof createCoachingService>

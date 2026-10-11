/**
 * The daily coach check-in, as pure functions: which facts about the user the coach may mention
 * today, and a template message for when the AI is unavailable (also the mock in dev).
 */
import type { Streak } from '../../gamification/contracts'
import type { CoachingContext } from '../../profile/contracts'
import { todayWorkout, weekProgress, type CoachSnapshot } from '../../training/contracts'

const DAY_MS = 24 * 60 * 60 * 1000
const epochDay = (day: string) => Math.round(Date.parse(`${day}T00:00:00Z`) / DAY_MS)
const RECENT_CHAT_CHARS = 300

export interface CheckInWorkout {
  title: string
  focus: string
}

export interface CheckInFacts {
  locale: CoachingContext['locale']
  firstName: string | null
  /** The user's local day ("YYYY-MM-DD"). */
  today: string
  /** A workout logged yesterday (the latest, if several). */
  yesterdayWorkout: CheckInWorkout | null
  /** Today's workout in the plan rotation, and whether it's already done. */
  todayWorkout: (CheckInWorkout & { done: boolean }) | null
  /** Whole days since the last logged workout; null if there is none yet. */
  daysSinceLastWorkout: number | null
  workoutsThisWeek: number
  /** Days per week in the plan. */
  weeklyTarget: number | null
  streak: number
  limitations: string | null
  /** The last few chat messages, oldest first, trimmed. */
  recentChat: { role: 'user' | 'assistant'; content: string }[]
}

export interface CheckInDraft {
  message: string
  quickReplies: string[]
}

export function buildCheckInFacts(input: {
  context: CoachingContext
  snapshot: CoachSnapshot
  streak: Pick<Streak, 'current'>
  recentChat: { role: 'user' | 'assistant'; content: string }[]
  today: string
}): CheckInFacts {
  const { context, snapshot, today } = input
  const yesterday = epochDay(today) - 1
  const sessions = snapshot.sessions
  const plan = snapshot.plan

  const dayOf = (planId: string, dayIndex: number): CheckInWorkout | null =>
    plan && plan.id === planId ? (plan.days[dayIndex] ?? null) : null

  const yesterdaySession = sessions.find((s) => epochDay(s.localDate) === yesterday)
  const yesterdayWorkout = yesterdaySession
    ? (dayOf(yesterdaySession.planId, yesterdaySession.dayIndex) ?? {
        title: yesterdaySession.dayTitle,
        focus: '',
      })
    : null

  let todayEntry: CheckInFacts['todayWorkout'] = null
  if (plan && plan.days.length > 0) {
    const next = todayWorkout(plan.id, plan.days.length, sessions, today)
    const day = plan.days[next.dayIndex]
    if (day) todayEntry = { ...day, done: next.doneToday }
  }

  const latest = sessions.reduce<string | null>(
    (best, s) => (best === null || s.localDate > best ? s.localDate : best),
    null,
  )

  return {
    locale: context.locale,
    firstName: context.displayName?.trim().split(/\s+/)[0] || null,
    today,
    yesterdayWorkout,
    todayWorkout: todayEntry,
    daysSinceLastWorkout: latest === null ? null : epochDay(today) - epochDay(latest),
    workoutsThisWeek: weekProgress(sessions, today).trainedDays,
    weeklyTarget: plan ? plan.days.length : null,
    streak: input.streak.current,
    limitations: snapshot.limitations,
    recentChat: input.recentChat.slice(-6).map((m) => ({
      role: m.role,
      content:
        m.content.length > RECENT_CHAT_CHARS
          ? `${m.content.slice(0, RECENT_CHAT_CHARS)}…`
          : m.content,
    })),
  }
}

/** The facts as plain lines for the model; only what's known is listed. */
export function describeFacts(facts: CheckInFacts): string {
  const lines = [`- Today (user's local date): ${facts.today}`]
  if (facts.yesterdayWorkout) {
    lines.push(`- Yesterday they trained: ${workoutLabel(facts.yesterdayWorkout)}`)
  }
  if (facts.todayWorkout) {
    lines.push(
      `- Today's workout in their plan: ${workoutLabel(facts.todayWorkout)}${facts.todayWorkout.done ? ' (already done today)' : ''}`,
    )
  } else {
    lines.push('- They have no training plan yet.')
  }
  if (facts.daysSinceLastWorkout === null) lines.push('- No workout logged yet.')
  else if (facts.daysSinceLastWorkout >= 3) {
    lines.push(`- Last workout was ${String(facts.daysSinceLastWorkout)} days ago.`)
  }
  if (facts.weeklyTarget) {
    lines.push(
      `- This week: ${String(facts.workoutsThisWeek)} of ${String(facts.weeklyTarget)} planned workouts.`,
    )
  }
  if (facts.streak > 1) lines.push(`- App streak: ${String(facts.streak)} days in a row.`)
  if (facts.limitations)
    lines.push(`- Injuries or limitations they told us: "${facts.limitations}"`)
  if (facts.recentChat.length > 0) {
    lines.push('- Recent conversation (oldest first):')
    for (const m of facts.recentChat) {
      lines.push(`  ${m.role === 'user' ? 'User' : 'Coach'}: ${m.content.replace(/\s+/g, ' ')}`)
    }
  }
  return lines.join('\n')
}

function workoutLabel(w: CheckInWorkout): string {
  return w.focus ? `${w.title} (${w.focus})` : w.title
}

/** "Dia 2 · Inferiores" → "inferiores"; titles without a name part are kept. */
function shortName(title: string): string {
  const parts = title.split('·')
  const name = (parts.length > 1 ? parts.slice(1).join('·') : title).trim()
  return name.charAt(0).toLowerCase() + name.slice(1)
}

const COPY = {
  'pt-BR': {
    hi: (name: string | null) => (name ? `Oi, ${name}!` : 'Oi!'),
    yesterday: (w: string) => `Como foi o treino de ${w} ontem? Sentiu alguma coisa diferente?`,
    yesterdayReplies: ['Foi ótimo 💪', 'Pesado, mas fiz', 'Senti dor'],
    limitation: (l: string) =>
      `Antes do treino de hoje: como está aquilo que você me contou ("${l}")?`,
    limitationReplies: ['Tudo bem hoje', 'Ainda incomoda', 'Me ajuda a adaptar'],
    comeback: (days: number, w: string | null) =>
      `Faz ${String(days)} dias desde o último treino. Semana corrida? Sem problema. Bora retomar${w ? ` hoje com ${w}` : ''}?`,
    comebackReplies: ['Bora!', 'Hoje não dá', 'Me ajuda a encaixar'],
    done: 'Treino de hoje feito! Como você está se sentindo?',
    doneReplies: ['Muito bem', 'Cansado', 'Com fome 😅'],
    today: (w: string) => `Hoje é dia de ${w}. Pronto pra começar?`,
    todayReplies: ['Pronto!', 'Tô cansado', 'Quero ajustar'],
    noPlan: 'Que tal montarmos seu plano de treino? Leva uns dois minutos.',
    noPlanReplies: ['Vamos!', 'Como funciona?', 'Depois'],
  },
  en: {
    hi: (name: string | null) => (name ? `Hi, ${name}!` : 'Hi!'),
    yesterday: (w: string) => `How was ${w} yesterday? Feel anything unusual?`,
    yesterdayReplies: ['It went great 💪', 'Tough, but done', 'Felt some pain'],
    limitation: (l: string) => `Before today's workout: how is what you told me about ("${l}")?`,
    limitationReplies: ['All good today', 'Still bothers me', 'Help me adapt'],
    comeback: (days: number, w: string | null) =>
      `It's been ${String(days)} days since your last workout. Busy week? No problem. Ready to get back${w ? ` with ${w} today` : ''}?`,
    comebackReplies: ["Let's go!", 'Not today', 'Help me fit it in'],
    done: "Today's workout is done! How are you feeling?",
    doneReplies: ['Really good', 'Tired', 'Hungry 😅'],
    today: (w: string) => `Today is ${w}. Ready to start?`,
    todayReplies: ['Ready!', "I'm tired", 'Adjust it'],
    noPlan: 'How about we build your training plan? It takes about two minutes.',
    noPlanReplies: ["Let's do it!", 'How does it work?', 'Later'],
  },
} as const

/**
 * A warm, specific check-in from templates, by priority: yesterday's workout, getting back after
 * a break, a limitation they mentioned, today's workout done or ahead, no plan yet.
 */
export function fallbackCheckIn(facts: CheckInFacts): CheckInDraft {
  const c = COPY[facts.locale]
  const hi = c.hi(facts.firstName)
  const today = facts.todayWorkout
  const pick = (text: string, replies: readonly string[]): CheckInDraft => ({
    message: `${hi} ${text}`,
    quickReplies: [...replies],
  })

  if (facts.yesterdayWorkout) {
    return pick(c.yesterday(shortName(facts.yesterdayWorkout.title)), c.yesterdayReplies)
  }
  if (facts.daysSinceLastWorkout !== null && facts.daysSinceLastWorkout >= 3) {
    return pick(
      c.comeback(facts.daysSinceLastWorkout, today && !today.done ? shortName(today.title) : null),
      c.comebackReplies,
    )
  }
  if (facts.limitations) {
    const short =
      facts.limitations.length > 60 ? `${facts.limitations.slice(0, 60)}…` : facts.limitations
    return pick(c.limitation(short), c.limitationReplies)
  }
  if (today?.done) return pick(c.done, c.doneReplies)
  if (today) return pick(c.today(shortName(today.title)), c.todayReplies)
  return pick(c.noPlan, c.noPlanReplies)
}

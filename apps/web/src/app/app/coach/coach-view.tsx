'use client'

import { cx, ErrorText, LogoMark, Skeleton } from '@/components/ui'
import { getApi, unwrap, writeHeaders } from '@/lib/api'
import { COACH_SUGGESTIONS } from '@/lib/labels'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useWrite } from '@/lib/use-write'
import { CHAT_MESSAGE_MAX_LENGTH, type ChatMessage } from '@mycoach/core/coaching/contracts'
import { ArrowUp, RotateCw } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'

const HISTORY_LIMIT = 50

export function CoachView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [messages, setMessages] = useState<ChatMessage[] | null>(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const startedFromQuery = useRef(false)

  // Reads go directly to Supabase (RLS: own rows only). Writes go through the API.
  useEffect(() => {
    void getSupabaseBrowserClient()
      .from('chat_messages')
      .select('id, role, content, created_at')
      .order('created_at', { ascending: false })
      .limit(HISTORY_LIMIT)
      .then(({ data }) => {
        setMessages(
          (data ?? []).reverse().map((row) => ({
            id: row.id,
            role: row.role as ChatMessage['role'],
            content: row.content,
            createdAt: row.created_at,
          })),
        )
      })
  }, [])

  const send = useWrite((key) =>
    unwrap(
      getApi().api.v1.chat.messages.$post(
        { json: { content: sending } },
        { headers: writeHeaders(key) },
      ),
    ),
  )
  const { pending, error } = send

  /** Sends the question in flight. Retries reuse the same Idempotency-Key and body. */
  function deliver() {
    void send.run().then((result) => {
      if (result) {
        setMessages((current) => [...(current ?? []), result.question, result.reply])
        setSending('')
      }
    })
  }

  // `sending` holds the question in flight, so the request body is stable across retries.
  useEffect(() => {
    if (sending) deliver()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deliver once per new question
  }, [sending])

  const ask = useCallback(
    (question: string) => {
      const content = question.trim()
      if (!content || pending || sending) return
      send.reset()
      setDraft('')
      setSending(content)
    },
    [pending, sending, send],
  )

  // A question tapped on the Home screen arrives as ?q=; send it once, then clean the URL.
  useEffect(() => {
    const q = searchParams.get('q')
    if (!q || startedFromQuery.current || messages === null) return
    startedFromQuery.current = true
    router.replace('/app/coach', { scroll: false })
    ask(q)
  }, [searchParams, messages, router, ask])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, sending, error])

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    ask(draft)
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      ask(draft)
    }
  }

  const failed = Boolean(error) && Boolean(sending) && !pending

  return (
    <div className="flex min-h-[calc(100dvh-14rem)] flex-col">
      <div className="flex-1">
        {messages === null ? (
          <div className="flex flex-col gap-3" aria-busy aria-label="Loading conversation">
            <Skeleton className="h-16 w-3/4" />
            <Skeleton className="ml-auto h-10 w-1/2" />
            <Skeleton className="h-24 w-4/5" />
          </div>
        ) : messages.length === 0 && !sending ? (
          <EmptyState onPick={ask} />
        ) : (
          <ol className="flex flex-col gap-3" aria-live="polite">
            {messages.map((m, i) => (
              <Bubble key={m.id} message={m} showAvatar={messages[i - 1]?.role !== m.role} />
            ))}
            {sending && (
              <>
                <Bubble
                  message={{ id: 'pending', role: 'user', content: sending, createdAt: '' }}
                  showAvatar
                  faded={failed}
                />
                {pending && <TypingIndicator />}
              </>
            )}
          </ol>
        )}
        {failed && (
          <div className="mt-3 flex flex-col items-end gap-2">
            <ErrorText>{error}</ErrorText>
            <button
              type="button"
              onClick={deliver}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent-soft"
            >
              <RotateCw className="size-4" aria-hidden />
              Try again
            </button>
          </div>
        )}
        <div ref={bottomRef} className="h-2" />
      </div>

      <form
        onSubmit={onSubmit}
        className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] mt-4 sm:bottom-6"
      >
        <div className="flex items-end gap-2 rounded-[26px] border border-line bg-surface p-1.5 pl-4 shadow-card transition-[border-color,box-shadow] focus-within:border-accent focus-within:ring-4 focus-within:ring-ring">
          <label htmlFor="coach-input" className="sr-only">
            Message your coach
          </label>
          <textarea
            id="coach-input"
            ref={inputRef}
            rows={1}
            placeholder="Ask your coach anything…"
            value={draft}
            maxLength={CHAT_MESSAGE_MAX_LENGTH}
            onChange={(e) => {
              setDraft(e.target.value)
            }}
            onKeyDown={onKeyDown}
            className="max-h-40 min-h-10 flex-1 resize-none bg-transparent py-2 text-base outline-none [field-sizing:content] placeholder:text-muted/70"
          />
          <button
            type="submit"
            disabled={!draft.trim() || pending || Boolean(sending)}
            aria-label="Send"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-accent-fg transition-[background-color,transform,opacity] hover:bg-accent-strong active:scale-90 disabled:opacity-30"
          >
            <ArrowUp className="size-5" strokeWidth={2.5} aria-hidden />
          </button>
        </div>
      </form>
    </div>
  )
}

function Bubble({
  message,
  showAvatar,
  faded = false,
}: {
  message: ChatMessage
  showAvatar: boolean
  faded?: boolean
}) {
  const mine = message.role === 'user'
  return (
    <li className={cx('flex gap-2.5 animate-rise-in', mine ? 'justify-end' : 'justify-start')}>
      {!mine && (
        <span className={cx('mt-0.5', !showAvatar && 'invisible')}>
          <LogoMark className="size-7" />
        </span>
      )}
      <div
        className={cx(
          'max-w-[85%] rounded-3xl px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap transition-opacity sm:max-w-[75%]',
          mine
            ? 'rounded-br-lg bg-accent text-accent-fg'
            : 'rounded-tl-lg border border-line bg-surface',
          faded && 'opacity-50',
        )}
      >
        {message.content}
      </div>
    </li>
  )
}

function TypingIndicator() {
  return (
    <li className="flex gap-2.5 animate-rise-in" aria-label="Coach is typing">
      <LogoMark className="size-7" />
      <div className="flex items-center gap-1 rounded-3xl rounded-tl-lg border border-line bg-surface px-4 py-3.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 rounded-full bg-muted"
            style={{ animation: `typing-dot 1.2s ${i * 0.15}s infinite ease-in-out` }}
          />
        ))}
      </div>
    </li>
  )
}

function EmptyState({ onPick }: { onPick: (question: string) => void }) {
  return (
    <div className="flex flex-col items-center px-2 pt-6 text-center animate-rise-in sm:pt-12">
      <LogoMark className="size-14" />
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Your coach</h1>
      <p className="mt-1 max-w-sm text-[15px] text-muted">
        Ask about training, nutrition, sleep or habits. Answers use your profile and energy test.
      </p>
      <div className="mt-6 flex w-full max-w-md flex-col gap-2">
        {COACH_SUGGESTIONS.map((question) => (
          <button
            key={question}
            type="button"
            onClick={() => {
              onPick(question)
            }}
            className="rounded-2xl border border-line bg-surface px-4 py-3 text-left text-[15px] transition-[background-color,transform] hover:bg-surface-2 active:scale-[0.99]"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  )
}

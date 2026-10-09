'use client'

import { Button, Card, ErrorText, inputClass } from '@/components/ui'
import { getApi, unwrap, writeHeaders } from '@/lib/api'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useWrite } from '@/lib/use-write'
import { CHAT_MESSAGE_MAX_LENGTH, type ChatMessage } from '@mycoach/core/coaching/contracts'
import { useEffect, useRef, useState, type FormEvent } from 'react'

const HISTORY_LIMIT = 50

export function ChatCard() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

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
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'nearest' })
  }, [messages])

  const send = useWrite((key) =>
    unwrap(
      getApi().api.v1.chat.messages.$post(
        { json: { content: draft } },
        { headers: writeHeaders(key) },
      ),
    ),
  )

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!draft.trim()) return
    const result = await send.run()
    if (result) {
      setMessages((current) => [...current, result.question, result.reply])
      setDraft('')
    }
  }

  return (
    <Card title="Ask your coach">
      <div className="mb-3 flex max-h-96 flex-col gap-2 overflow-y-auto" aria-live="polite">
        {loading && <p className="text-sm text-slate-500">Loading…</p>}
        {!loading && messages.length === 0 && (
          <p className="text-sm text-slate-500">
            Ask anything about training, nutrition or habits.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
              m.role === 'user' ? 'self-end bg-emerald-600 text-white' : 'self-start bg-slate-100'
            }`}
          >
            {m.content}
          </div>
        ))}
        {send.pending && (
          <>
            <div className="max-w-[85%] self-end rounded-2xl bg-emerald-600/60 px-3 py-2 text-sm text-white">
              {draft}
            </div>
            <div className="self-start rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-500">
              Coach is typing…
            </div>
          </>
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          className={inputClass}
          placeholder="How much protein should I eat?"
          value={draft}
          maxLength={CHAT_MESSAGE_MAX_LENGTH}
          disabled={send.pending}
          onChange={(e) => {
            setDraft(e.target.value)
            send.reset()
          }}
        />
        <Button type="submit" disabled={send.pending || !draft.trim()}>
          Send
        </Button>
      </form>
      <div className="mt-2">
        <ErrorText>{send.error}</ErrorText>
      </div>
    </Card>
  )
}

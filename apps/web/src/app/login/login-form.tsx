'use client'

import { Button, ErrorText, Field, inputClass } from '@/components/ui'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useState, type FormEvent } from 'react'

export function LoginForm({ linkError }: { linkError: boolean }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState(linkError ? 'That link is invalid or expired. Try again.' : '')

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setStatus('sending')
    setError('')
    const { error: signInError } = await getSupabaseBrowserClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/app` },
    })
    if (signInError) {
      setError(signInError.message)
      setStatus('idle')
      return
    }
    setStatus('sent')
  }

  if (status === 'sent') {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
        <p className="font-medium">Check your email for a sign-in link.</p>
        {process.env.NODE_ENV === 'development' && (
          <p className="mt-2 text-slate-600">
            Local dev: open the Supabase inbox at{' '}
            <a className="underline" href="http://127.0.0.1:54324" target="_blank" rel="noreferrer">
              127.0.0.1:54324
            </a>
            .
          </p>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <Field label="Email">
        <input
          className={inputClass}
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
          }}
        />
      </Field>
      <ErrorText>{error}</ErrorText>
      <Button type="submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Send magic link'}
      </Button>
    </form>
  )
}

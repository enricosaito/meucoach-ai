'use client'

import { Button, ErrorText, Field, inputClass } from '@/components/ui'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError('')
    const { error: signInError } = await getSupabaseBrowserClient().auth.signInWithPassword({
      email,
      password,
    })
    if (signInError) {
      setError(
        signInError.code === 'invalid_credentials'
          ? 'Wrong email or password.'
          : signInError.message,
      )
      setPending(false)
      return
    }
    // The session cookie is set; re-render server components with the signed-in user.
    router.replace('/app')
    router.refresh()
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
      <Field label="Password">
        <input
          className={inputClass}
          type="password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
          }}
        />
      </Field>
      <ErrorText>{error}</ErrorText>
      <Button type="submit" disabled={pending}>
        {pending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  )
}

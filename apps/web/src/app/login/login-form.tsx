'use client'

import { Button, ErrorText, Field, inputClass } from '@/components/ui'
import { useI18n } from '@/lib/i18n/client'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import { Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

export function LoginForm() {
  const router = useRouter()
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError('')
    const { error: signInError } = await getSupabaseBrowserClient().auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (signInError) {
      setError(
        signInError.code === 'invalid_credentials'
          ? t('auth.invalidCredentials')
          : t('errors.generic'),
      )
      setPending(false)
      return
    }
    // The session cookie is set; re-render server components with the signed-in user.
    router.replace('/app')
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field label={t('auth.email')} htmlFor="email">
        <input
          id="email"
          className={inputClass}
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder={t('auth.emailPlaceholder')}
          required
          autoFocus
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setError('')
          }}
        />
      </Field>
      <Field label={t('auth.password')} htmlFor="password">
        <div className="relative">
          <input
            id="password"
            className={`${inputClass} pr-12`}
            type={showPassword ? 'text' : 'password'}
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError('')
            }}
          />
          <button
            type="button"
            onClick={() => {
              setShowPassword((v) => !v)
            }}
            aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-1.5 my-auto grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            {showPassword ? (
              <EyeOff className="size-[18px]" aria-hidden />
            ) : (
              <Eye className="size-[18px]" aria-hidden />
            )}
          </button>
        </div>
      </Field>
      <ErrorText>{error}</ErrorText>
      <Button type="submit" loading={pending} className="mt-2 w-full">
        {pending ? t('auth.submitting') : t('auth.submit')}
      </Button>
    </form>
  )
}

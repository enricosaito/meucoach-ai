'use client'

import { useRef, useState } from 'react'
import { newIdempotencyKey } from './api'

/**
 * Runs an API write with an Idempotency-Key. The same key is reused when the user retries after a
 * failure, so a request that actually succeeded server-side is never applied twice.
 */
export function useWrite<T>(write: (idempotencyKey: string) => Promise<T>) {
  const keyRef = useRef<string | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function run(): Promise<T | undefined> {
    keyRef.current ??= newIdempotencyKey()
    setPending(true)
    setError('')
    try {
      const result = await write(keyRef.current)
      keyRef.current = null
      return result
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      return undefined
    } finally {
      setPending(false)
    }
  }

  /** Call when the input changes: a different request needs a new key. */
  function reset() {
    keyRef.current = null
  }

  return { run, reset, pending, error }
}

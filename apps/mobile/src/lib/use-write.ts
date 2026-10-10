import { useRef, useState } from 'react'
import { newIdempotencyKey } from './api'
import { errorMessage, useI18n } from './i18n'

/**
 * Runs an API write with an Idempotency-Key (same as the web app's useWrite). The key is reused
 * when the user retries after a failure, so a write that succeeded server-side is never applied
 * twice; call `reset()` when the input changes.
 */
export function useWrite<T>(write: (idempotencyKey: string) => Promise<T>) {
  const { t } = useI18n()
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
      setError(errorMessage(t, e))
      return undefined
    } finally {
      setPending(false)
    }
  }

  function reset() {
    keyRef.current = null
  }

  return { run, reset, pending, error }
}

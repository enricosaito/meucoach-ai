import type { CheckIn } from '@mycoach/core/coaching/contracts'
import { useCallback, useEffect, useState } from 'react'
import { api, newIdempotencyKey, unwrap, writeHeaders } from './api'
import { errorMessage, useI18n } from './i18n'

/**
 * Today's coach check-in. The first call of the user's day makes the coach write it (a second or
 * two); later calls return the same message. Each call is its own write, so a fresh key is fine.
 */
export function useCheckIn() {
  const { t } = useI18n()
  const [checkIn, setCheckIn] = useState<CheckIn | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      setCheckIn(
        await unwrap(
          api.chat['check-in'].$post({}, { headers: writeHeaders(newIdempotencyKey()) }),
        ),
      )
    } catch (e) {
      setError(errorMessage(t, e))
    }
  }, [t])

  useEffect(() => {
    void load()
  }, [load])

  return { checkIn, error, reload: load }
}

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  /** Epoch milliseconds when the current window resets. */
  resetAt: number
}

/**
 * Swappable rate limiter. In-memory locally (single process); use a shared store such as
 * Upstash Redis in production so limits hold across instances.
 */
export interface RateLimiter {
  consume(key: string, limit: number, windowMs: number): Promise<RateLimitResult>
}

/** Fixed-window counter held in process memory. Not shared between server instances. */
export function createInMemoryRateLimiter(options: { now?: () => number } = {}): RateLimiter {
  const now = options.now ?? Date.now
  const windows = new Map<string, { count: number; resetAt: number }>()
  let lastSweep = now()

  function sweep(time: number) {
    if (time - lastSweep < 60_000) return
    lastSweep = time
    for (const [key, window] of windows) if (window.resetAt <= time) windows.delete(key)
  }

  return {
    consume(key, limit, windowMs) {
      const time = now()
      sweep(time)
      let window = windows.get(key)
      if (!window || window.resetAt <= time) {
        window = { count: 0, resetAt: time + windowMs }
        windows.set(key, window)
      }
      window.count += 1
      return Promise.resolve({
        allowed: window.count <= limit,
        limit,
        remaining: Math.max(0, limit - window.count),
        resetAt: window.resetAt,
      })
    },
  }
}

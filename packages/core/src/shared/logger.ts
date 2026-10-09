type LogFn = (obj: Record<string, unknown>, msg?: string) => void

/** Minimal structured logger contract. pino satisfies it; core never depends on pino directly. */
export interface Logger {
  debug: LogFn
  info: LogFn
  warn: LogFn
  error: LogFn
  child(bindings: Record<string, unknown>): Logger
}

export const noopLogger: Logger = {
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
  child: () => noopLogger,
}

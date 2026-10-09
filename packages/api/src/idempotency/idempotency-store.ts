export type ClaimResult =
  | { kind: 'claimed' }
  | { kind: 'replay'; status: number; body: unknown }
  | { kind: 'in_progress' }
  | { kind: 'mismatch' }

export interface IdempotencyStore {
  /** Atomically reserves (userId, key) for a request with the given body hash. */
  claim(userId: string, key: string, requestHash: string): Promise<ClaimResult>
  /** Stores the final response so retries with the same key replay it. */
  complete(userId: string, key: string, status: number, body: unknown): Promise<void>
  /** Frees the key after a server error so the client can retry. */
  release(userId: string, key: string): Promise<void>
}

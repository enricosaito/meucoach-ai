export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

export interface ProviderChatRequest {
  system: string
  messages: ChatTurn[]
  maxTokens: number
}

export interface ProviderChatResult {
  text: string
  model: string
  inputTokens: number
  outputTokens: number
  /** True when the model declined to answer (safety refusal). */
  refused: boolean
}

/** Every AI vendor integration implements this. Add new capabilities here, never call SDKs directly. */
export interface AiProvider {
  readonly name: string
  chat(request: ProviderChatRequest): Promise<ProviderChatResult>
}

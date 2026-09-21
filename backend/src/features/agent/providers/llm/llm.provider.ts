export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  name?: string;
  toolCallId?: string;
}

export interface LLMCompletionOptions {
  temperature?: number;
  maxTokens?: number;
  tools?: any[];
  toolChoice?: 'auto' | 'none' | 'required';
}

export interface LLMCompletionResult {
  content: string;
  toolCalls?: Array<{
    id: string;
    name: string;
    args: Record<string, unknown>;
  }>;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMProvider {
  readonly name: string;
  complete(messages: ChatMessage[], options?: LLMCompletionOptions): Promise<LLMCompletionResult>;
  stream(messages: ChatMessage[], options?: LLMCompletionOptions): AsyncIterable<string>;
}

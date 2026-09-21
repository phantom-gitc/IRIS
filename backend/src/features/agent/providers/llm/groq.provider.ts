import { Groq } from 'groq-sdk';
import { env } from '../../../../config/env';
import { LLMProvider, ChatMessage, LLMCompletionOptions, LLMCompletionResult } from './llm.provider';
import { ExternalServiceError } from '../../../../shared/errors';
import { logger } from '../../../../config/logger';

export class GroqProvider implements LLMProvider {
  public readonly name = 'groq';
  private groq: Groq;
  private defaultModel = 'qwen/qwen3.8-27b';

  constructor() {
    this.groq = new Groq({ apiKey: env.GROQ_API_KEY || 'mock_key' });
  }

  async complete(messages: ChatMessage[], options?: LLMCompletionOptions): Promise<LLMCompletionResult> {
    try {
      const formattedMessages = messages.map((m) => {
        if (m.role === 'tool') {
          return {
            role: 'tool' as const,
            content: m.content,
            tool_call_id: m.toolCallId || 'call_default',
          };
        }
        return {
          role: m.role as any,
          content: m.content,
        };
      });

      const response = await this.groq.chat.completions.create({
        model: this.defaultModel,
        messages: formattedMessages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2048,
        tools: options?.tools && options.tools.length > 0 ? options.tools : undefined,
      });

      const choice = response.choices[0];
      const message = choice?.message;

      const toolCalls = message?.tool_calls?.map((tc) => ({
        id: tc.id,
        name: tc.function.name,
        args: JSON.parse(tc.function.arguments || '{}'),
      }));

      return {
        content: message?.content || '',
        toolCalls,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Groq completion error');
      throw new ExternalServiceError(`Groq completion failed: ${(error as Error).message}`);
    }
  }

  async *stream(messages: ChatMessage[], options?: LLMCompletionOptions): AsyncIterable<string> {
    try {
      const stream = await this.groq.chat.completions.create({
        model: this.defaultModel,
        messages: messages.map((m) => ({
          role: m.role as any,
          content: m.content,
        })),
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2048,
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          yield delta;
        }
      }
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Groq stream error');
      throw new ExternalServiceError(`Groq streaming failed: ${(error as Error).message}`);
    }
  }
}

export const groqProvider = new GroqProvider();

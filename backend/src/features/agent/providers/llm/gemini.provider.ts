import { GoogleGenAI } from '@google/genai';
import { env } from '../../../../config/env';
import { LLMProvider, ChatMessage, LLMCompletionOptions, LLMCompletionResult } from './llm.provider';
import { ExternalServiceError } from '../../../../shared/errors';
import { logger } from '../../../../config/logger';

export class GeminiProvider implements LLMProvider {
  public readonly name = 'gemini';
  private ai: GoogleGenAI;
  private defaultModel = 'gemini-3.5-flash';

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY || 'mock_key' });
  }

  private formatMessages(messages: ChatMessage[]) {
    const systemParts: string[] = [];
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    for (const m of messages) {
      if (m.role === 'system') {
        if (m.content) systemParts.push(m.content);
      } else {
        const role: 'user' | 'model' = m.role === 'assistant' ? 'model' : 'user';
        const last = contents[contents.length - 1];
        if (last && last.role === role) {
          last.parts[0]!.text += `\n\n${m.content}`;
        } else {
          contents.push({ role, parts: [{ text: m.content || ' ' }] });
        }
      }
    }

    if (contents.length === 0) {
      contents.push({ role: 'user', parts: [{ text: 'Hello' }] });
    }

    return {
      systemInstruction: systemParts.length > 0 ? systemParts.join('\n\n') : undefined,
      contents,
    };
  }

  async complete(messages: ChatMessage[], options?: LLMCompletionOptions): Promise<LLMCompletionResult> {
    try {
      const { systemInstruction, contents } = this.formatMessages(messages);

      const functionDeclarations = options?.tools?.map((t) => ({
        name: t.function.name,
        description: t.function.description,
        parameters: t.function.parameters,
      }));

      const config: Record<string, any> = {
        systemInstruction,
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 2048,
      };

      if (functionDeclarations && functionDeclarations.length > 0) {
        config.tools = [{ functionDeclarations }];
      }

      const response = await (this.ai as any).models.generateContent({
        model: this.defaultModel,
        contents,
        config,
      });

      const toolCalls = response.functionCalls?.map((fc: any, idx: number) => ({
        id: fc.id || `call_${fc.name}_${Date.now()}_${idx}`,
        name: fc.name,
        args: fc.args || {},
      }));

      return {
        content: response.text || '',
        toolCalls: toolCalls && toolCalls.length > 0 ? toolCalls : undefined,
        usage: {
          promptTokens: response.usageMetadata?.promptTokenCount || 0,
          completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: response.usageMetadata?.totalTokenCount || 0,
        },
      };
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Gemini completion error');
      throw new ExternalServiceError(`Gemini completion failed: ${(error as Error).message}`);
    }
  }

  async *stream(messages: ChatMessage[], options?: LLMCompletionOptions): AsyncIterable<string> {
    try {
      const { systemInstruction, contents } = this.formatMessages(messages);

      const responseStream = await (this.ai as any).models.generateContentStream({
        model: this.defaultModel,
        contents,
        config: {
          systemInstruction,
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens ?? 2048,
        },
      });

      for await (const chunk of responseStream) {
        if (chunk.text) {
          yield chunk.text;
        }
      }
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Gemini streaming error');
      throw new ExternalServiceError(`Gemini streaming failed: ${(error as Error).message}`);
    }
  }
}

export const geminiProvider = new GeminiProvider();

import { env } from '../../../../config/env';
import { LLMProvider } from './llm.provider';
import { groqProvider } from './groq.provider';
import { geminiProvider } from './gemini.provider';

export * from './llm.provider';
export { groqProvider } from './groq.provider';
export { geminiProvider } from './gemini.provider';

export function getLLMProvider(preferredProvider?: 'groq' | 'gemini'): LLMProvider {
  const chosen = preferredProvider || env.AI_PROVIDER;
  if (chosen === 'gemini') {
    return geminiProvider;
  }
  return groqProvider;
}

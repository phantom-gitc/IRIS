import { describe, it, expect } from 'vitest';
import { getLLMProvider, groqProvider, geminiProvider } from '../../src/features/agent/providers/llm';
import { getSTTProvider, groqWhisperProvider, sarvamSTTProvider } from '../../src/features/agent/providers/stt';
import { getTTSProvider, defaultTTSProvider, sarvamTTSProvider } from '../../src/features/agent/providers/tts';

describe('AI & Voice Provider Abstractions', () => {
  describe('LLM Providers', () => {
    it('returns groqProvider by default or when requested', () => {
      const provider = getLLMProvider('groq');
      expect(provider.name).toBe('groq');
      expect(provider).toBe(groqProvider);
    });

    it('returns geminiProvider when requested', () => {
      const provider = getLLMProvider('gemini');
      expect(provider.name).toBe('gemini');
      expect(provider).toBe(geminiProvider);
    });
  });

  describe('STT Providers', () => {
    it('returns groqWhisperProvider by default', () => {
      const provider = getSTTProvider();
      expect(provider.name).toBe('groq-whisper');
      expect(provider).toBe(groqWhisperProvider);
    });

    it('returns sarvamSTTProvider when requested', () => {
      const provider = getSTTProvider('sarvam');
      expect(provider.name).toBe('sarvam-stt');
      expect(provider).toBe(sarvamSTTProvider);
    });
  });

  describe('TTS Providers', () => {
    it('returns defaultTTSProvider when fallback selected', () => {
      const provider = getTTSProvider('default');
      expect(provider.name).toBe('default-tts');
      expect(provider).toBe(defaultTTSProvider);
    });

    it('returns sarvamTTSProvider when configured', () => {
      const provider = getTTSProvider('sarvam');
      expect(provider.name).toBe('sarvam-tts');
      expect(provider).toBe(sarvamTTSProvider);
    });
  });
});

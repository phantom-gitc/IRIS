import { STTProvider } from './stt.provider';
import { groqWhisperProvider } from './groq-whisper.provider';
import { sarvamSTTProvider } from './sarvam-stt.provider';

export * from './stt.provider';
export { groqWhisperProvider } from './groq-whisper.provider';
export { sarvamSTTProvider } from './sarvam-stt.provider';

export function getSTTProvider(preference?: 'groq' | 'sarvam'): STTProvider {
  if (preference === 'sarvam') {
    return sarvamSTTProvider;
  }
  return groqWhisperProvider;
}

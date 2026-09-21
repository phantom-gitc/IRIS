import { TTSProvider } from './tts.provider';
import { defaultTTSProvider } from './default.provider';
import { sarvamTTSProvider } from './sarvam-tts.provider';
import { kokoroTTSProvider } from './kokoro-tts.provider';

export * from './tts.provider';
export { defaultTTSProvider } from './default.provider';
export { sarvamTTSProvider } from './sarvam-tts.provider';
export { kokoroTTSProvider } from './kokoro-tts.provider';

export function getTTSProvider(preference?: 'kokoro' | 'sarvam' | 'default'): TTSProvider {
  if (preference === 'sarvam') {
    return sarvamTTSProvider;
  }
  if (preference === 'default') {
    return defaultTTSProvider;
  }
  // Default to Kokoro-js with af_heart voice
  return kokoroTTSProvider;
}

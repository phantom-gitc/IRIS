import { TTSProvider, TTSOptions, TTSResult } from './tts.provider';

export class DefaultTTSProvider implements TTSProvider {
  public readonly name = 'default-tts';

  async synthesize(_text: string, _options?: TTSOptions): Promise<TTSResult> {
    // Return mock empty PCM/WAV buffer for fallback testing
    const emptyWavHeader = Buffer.alloc(44);
    return {
      audioBuffer: emptyWavHeader,
      mimeType: 'audio/wav',
    };
  }
}

export const defaultTTSProvider = new DefaultTTSProvider();

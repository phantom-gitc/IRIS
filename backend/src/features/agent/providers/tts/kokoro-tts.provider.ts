import { KokoroTTS } from 'kokoro-js';
import { TTSProvider, TTSOptions, TTSResult } from './tts.provider';
import { logger } from '../../../../config/logger';
import { sarvamTTSProvider } from './sarvam-tts.provider';

export class KokoroTTSProvider implements TTSProvider {
  public readonly name = 'kokoro';
  private ttsPromise: Promise<any> | null = null;
  private defaultVoice = 'af_heart';

  constructor() {
    // Eagerly pre-warm the model in the background
    this.getModel().catch(() => {});
  }

  private async getModel(): Promise<any> {
    if (!this.ttsPromise) {
      this.ttsPromise = KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
        dtype: 'q8',
      }).catch((err: any) => {
        logger.error({ error: err.message }, 'Failed to initialize KokoroTTS model');
        this.ttsPromise = null;
        throw err;
      });
    }
    return this.ttsPromise;
  }

  private extractSpokenSnippet(text: string): string {
    const clean = text.trim();
    if (clean.length <= 160) return clean;

    // Break by sentence boundaries to keep speech natural and low-latency
    const sentences = clean.match(/[^.!?]+[.!?]+(\s|$)/g);
    if (sentences && sentences.length > 0) {
      let snippet = '';
      for (const s of sentences) {
        if ((snippet + s).length > 160) break;
        snippet += s;
      }
      if (snippet.trim()) return snippet.trim();
    }

    return clean.slice(0, 140).trim() + '...';
  }

  async synthesize(text: string, options?: TTSOptions): Promise<TTSResult> {
    const spokenText = this.extractSpokenSnippet(text);

    try {
      // Race Kokoro against a 3.5-second timeout to prevent slow CPU synthesis
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Kokoro CPU synthesis exceeded 3.5s deadline')), 3500)
      );

      const synthesisPromise = (async () => {
        const model = await this.getModel();
        const voice = options?.voice || this.defaultVoice;
        const result = await model.generate(spokenText, { voice });
        const wavArrayBuffer = result.toWav();
        return {
          audioBuffer: Buffer.from(wavArrayBuffer),
          mimeType: 'audio/wav',
        };
      })();

      return await Promise.race([synthesisPromise, timeoutPromise]);
    } catch (error) {
      logger.warn(
        { error: (error as Error).message },
        'Kokoro TTS slow or failed, falling back to instant Sarvam cloud TTS'
      );
      return sarvamTTSProvider.synthesize(spokenText, options);
    }
  }
}

export const kokoroTTSProvider = new KokoroTTSProvider();

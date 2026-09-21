import { Groq } from 'groq-sdk';
import { env } from '../../../../config/env';
import { STTProvider, STTOptions, STTResult } from './stt.provider';
import { ExternalServiceError } from '../../../../shared/errors';
import { logger } from '../../../../config/logger';

export class GroqWhisperProvider implements STTProvider {
  public readonly name = 'groq-whisper';
  private groq: Groq;
  private defaultModel = 'whisper-large-v3-turbo';

  constructor() {
    this.groq = new Groq({ apiKey: env.GROQ_API_KEY || 'mock_key' });
  }

  async transcribe(audioBuffer: Buffer, filename = 'audio.wav', options?: STTOptions): Promise<STTResult> {
    try {
      const isWebm = audioBuffer.length > 4 && audioBuffer[0] === 0x1a && audioBuffer[1] === 0x45;
      const actualName = isWebm ? 'audio.webm' : filename;
      const mimeType = isWebm ? 'audio/webm' : 'audio/wav';
      const file = await Groq.toFile(audioBuffer, actualName, { type: mimeType });

      const transcription = await this.groq.audio.transcriptions.create({
        file,
        model: this.defaultModel,
        language: options?.language,
        prompt: options?.prompt,
        temperature: options?.temperature,
      });

      return {
        text: transcription.text,
      };
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Groq Whisper transcription failed');
      throw new ExternalServiceError(`Groq Whisper transcription failed: ${(error as Error).message}`);
    }
  }
}

export const groqWhisperProvider = new GroqWhisperProvider();

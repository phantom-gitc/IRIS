import { env } from '../../../../config/env';
import { STTProvider, STTOptions, STTResult } from './stt.provider';
import { ExternalServiceError, ConfigurationError } from '../../../../shared/errors';
import { logger } from '../../../../config/logger';

export class SarvamSTTProvider implements STTProvider {
  public readonly name = 'sarvam-stt';
  private apiUrl = 'https://api.sarvam.ai/speech-to-text';

  async transcribe(audioBuffer: Buffer, filename = 'audio.wav', options?: STTOptions): Promise<STTResult> {
    if (!env.SARVAM_API_KEY) {
      throw new ConfigurationError('SARVAM_API_KEY is not configured');
    }

    try {
      const formData = new FormData();
      const blob = new Blob([new Uint8Array(audioBuffer)], { type: 'audio/wav' });
      formData.append('file', blob, filename);
      if (options?.language) {
        formData.append('language_code', options.language);
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'api-subscription-key': env.SARVAM_API_KEY,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Sarvam STT failed with status ${response.status}: ${errorText}`);
      }

      const data = (await response.json()) as { transcript: string; language_code?: string };

      return {
        text: data.transcript,
        language: data.language_code,
      };
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Sarvam STT transcription failed');
      throw new ExternalServiceError(`Sarvam STT failed: ${(error as Error).message}`);
    }
  }
}

export const sarvamSTTProvider = new SarvamSTTProvider();

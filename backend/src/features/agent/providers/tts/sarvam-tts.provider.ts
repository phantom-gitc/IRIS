import { env } from '../../../../config/env';
import { TTSProvider, TTSOptions, TTSResult } from './tts.provider';
import { ExternalServiceError, ConfigurationError } from '../../../../shared/errors';
import { logger } from '../../../../config/logger';

export class SarvamTTSProvider implements TTSProvider {
  public readonly name = 'sarvam-tts';
  private apiUrl = 'https://api.sarvam.ai/text-to-speech';

  async synthesize(text: string, options?: TTSOptions): Promise<TTSResult> {
    if (!env.SARVAM_API_KEY) {
      throw new ConfigurationError('SARVAM_API_KEY is not configured');
    }

    try {
      const SARVAM_VALID_VOICES = new Set([
        'kavya', 'meera', 'arvind', 'shreya', 'rohan', 'priya', 'neha', 'rahul', 'aditya', 'ritu', 'ashutosh', 'ratan', 'varun', 'simran', 'pooja'
      ]);
      const requestedVoice = options?.voice?.toLowerCase() || '';
      const speaker = SARVAM_VALID_VOICES.has(requestedVoice) ? requestedVoice : 'kavya';

      const payload = {
        inputs: [text],
        target_language_code: options?.language || 'en-IN',
        speaker,
        pitch: 0,
        pace: options?.speed || 1.05,
        loudness: 1.1,
        speech_sample_rate: 16000,
        enable_preprocessing: true,
        model: 'bulbul:v3',
      };

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': env.SARVAM_API_KEY,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Sarvam TTS failed with status ${response.status}: ${errorText}`);
      }

      const data = (await response.json()) as { audios: string[] };
      const base64Audio = data.audios[0] || '';
      const audioBuffer = Buffer.from(base64Audio, 'base64');

      return {
        audioBuffer,
        mimeType: 'audio/wav',
      };
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Sarvam TTS synthesis failed');
      throw new ExternalServiceError(`Sarvam TTS failed: ${(error as Error).message}`);
    }
  }
}

export const sarvamTTSProvider = new SarvamTTSProvider();

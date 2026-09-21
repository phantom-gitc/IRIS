import { Request, Response, NextFunction } from 'express';
import { liveKitService } from './livekit.service';
import { ApiResponse } from '../../shared/types';
import { RealtimeSessionResponse } from './realtime.types';
import { AuthenticationError } from '../../shared/errors';
import { getTTSProvider } from '../agent/providers/tts';
import { getSTTProvider } from '../agent/providers/stt';

export class RealtimeController {
  async createSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required to initialize realtime session');
      }

      const { roomName, metadata } = req.body || {};
      const session = await liveKitService.createSessionToken(req.user.id, roomName, metadata);

      const response: ApiResponse<RealtimeSessionResponse> = {
        success: true,
        data: session,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async synthesize(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { text, languageCode, speaker, provider } = req.body || {};
      if (!text || typeof text !== 'string') {
        throw new AuthenticationError('Field text is required for TTS synthesis');
      }

      const tts = getTTSProvider(provider);
      const ttsResult = await tts.synthesize(text, { language: languageCode, voice: speaker });

      const response: ApiResponse<{ audioBase64: string; format: string; provider: string }> = {
        success: true,
        data: {
          audioBase64: ttsResult.audioBuffer.toString('base64'),
          format: ttsResult.mimeType || 'audio/wav',
          provider: tts.name,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async transcribe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { audioBase64, languageCode, provider } = req.body || {};
      if (!audioBase64 || typeof audioBase64 !== 'string') {
        throw new AuthenticationError('Field audioBase64 is required for transcription');
      }

      const audioBuffer = Buffer.from(audioBase64, 'base64');
      const stt = getSTTProvider(provider);
      const result = await stt.transcribe(audioBuffer, 'audio.wav', { language: languageCode });

      const response: ApiResponse<{ text: string; language?: string; provider: string }> = {
        success: true,
        data: {
          text: result.text,
          language: result.language,
          provider: stt.name,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const realtimeController = new RealtimeController();


import { Request, Response, NextFunction } from 'express';
import { agentService } from './agent.service';
import { voiceAgentService } from './voice-agent.service';
import { ApiResponse } from '../../shared/types';
import { AuthenticationError, ValidationError } from '../../shared/errors';
import { AcknowledgmentEngine } from './realtime/acknowledgment.engine';
import { getSTTProvider } from './providers/stt';
import { TaskContextManager } from './task-context.manager';
import { logger } from '../../config/logger';

export class AgentController {
  async chat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError('Authentication required');
      const { conversationId, prompt, confirmationToken, taskId } = req.body || {};

      if (!conversationId || !prompt) {
        throw new ValidationError('Both conversationId and prompt are required');
      }

      const result = await agentService.processUserMessage({
        userId: req.user.id,
        conversationId,
        prompt,
        confirmationToken,
        taskId,
      });

      const response: ApiResponse<typeof result> = {
        success: true,
        data: result,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async voiceCommand(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError('Authentication required');
      const {
        conversationId,
        audioInputBase64,
        prompt,
        confirmationToken,
        taskId,
        sttPreference,
        ttsPreference,
      } = req.body || {};

      if (!conversationId || (!prompt && !audioInputBase64)) {
        throw new ValidationError('conversationId and either prompt or audioInputBase64 are required');
      }

      const result = await voiceAgentService.processVoiceCommand({
        userId: req.user.id,
        conversationId,
        audioInputBase64,
        prompt,
        confirmationToken,
        taskId,
        sttPreference,
        ttsPreference,
      });

      const response: ApiResponse<typeof result> = {
        success: true,
        data: result,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async interrupt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError('Authentication required');
      const { conversationId } = req.body || {};

      if (!conversationId) {
        throw new ValidationError('conversationId is required to interrupt speech');
      }

      const interrupted = voiceAgentService.interruptSpeech(conversationId);
      const response: ApiResponse<{ interrupted: boolean; conversationId: string }> = {
        success: true,
        data: { interrupted, conversationId },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async voiceStream(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError('Authentication required');
      const {
        conversationId,
        audioInputBase64,
        prompt,
        confirmationToken,
        taskId,
        sttPreference,
        ttsPreference,
      } = req.body || {};

      if (!conversationId || (!prompt && !audioInputBase64)) {
        throw new ValidationError('conversationId and either prompt or audioInputBase64 are required');
      }

      // Configure SSE response headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders?.();

      const sendEvent = (event: string, data: unknown) => {
        if (!res.writableEnded) {
          res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
        }
      };

      let activePrompt = prompt || '';

      // 1. Fast STT transcription (<150ms)
      if (audioInputBase64) {
        try {
          const buffer = Buffer.from(audioInputBase64, 'base64');
          const stt = getSTTProvider(sttPreference);
          const sttResult = await stt.transcribe(buffer, 'command.webm');
          activePrompt = sttResult.text.trim();
        } catch {
          // fallback to text prompt if STT errors
        }
      }

      activePrompt = TaskContextManager.resolveContextReferences(conversationId, activePrompt);
      sendEvent('transcription', { text: activePrompt });

      // 2. Dispatched immediate verbal acknowledgment in under 250ms ONLY for action/tool requests
      if (activePrompt) {
        const ack = AcknowledgmentEngine.detectAction(activePrompt);
        if (ack) {
          const audioBase64 = await AcknowledgmentEngine.resolveAudio(ack);
          sendEvent('acknowledgment', {
            text: ack.phrase,
            audioBase64,
            actionType: ack.actionType,
          });
        }
      }

      // 3. Concurrently execute the main turn (Tools + LLM + TTS)
      const result = await voiceAgentService.processVoiceCommand({
        userId: req.user.id,
        conversationId,
        prompt: activePrompt,
        confirmationToken,
        taskId,
        sttPreference,
        ttsPreference,
      });

      // 4. Send complete answer
      sendEvent('answer', {
        response: result.response,
        audioBase64: result.audioBase64 || result.audioOutputBase64,
        toolExecuted: result.toolExecuted,
        requiresConfirmation: result.requiresConfirmation,
      });

      sendEvent('done', { success: true });
      res.end();
    } catch (error) {
      logger.error({ error: (error as Error).stack }, 'Voice stream processing failed');
      if (!res.headersSent) {
        next(error);
      } else {
        const fallbackMsg = "I'm having a little trouble with my connection right now. Could you please say that again?";
        if (!res.writableEnded) {
          res.write(`event: answer\ndata: ${JSON.stringify({ response: fallbackMsg })}\n\n`);
          res.write(`event: done\ndata: ${JSON.stringify({ success: false })}\n\n`);
          res.end();
        }
      }
    }
  }
}

export const agentController = new AgentController();



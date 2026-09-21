import { EventEmitter } from 'events';
import { AgentState } from '../agent.state';
import { logger } from '../../../config/logger';

export interface SpeechSessionState {
  conversationId: string;
  isSpeaking: boolean;
  activeUtteranceId?: string;
  abortController?: AbortController;
  startedAt?: number;
}

export class SpeechStateManager extends EventEmitter {
  private sessions = new Map<string, SpeechSessionState>();

  /**
   * Registers that IRIS has started speaking an utterance.
   */
  startSpeaking(conversationId: string, utteranceId: string): AbortController {
    // If already speaking, cancel the previous one first
    this.interrupt(conversationId);

    const abortController = new AbortController();
    this.sessions.set(conversationId, {
      conversationId,
      isSpeaking: true,
      activeUtteranceId: utteranceId,
      abortController,
      startedAt: Date.now(),
    });

    this.emit('stateChange', {
      conversationId,
      state: 'SPEAKING' as AgentState,
      utteranceId,
    });

    logger.debug({ conversationId, utteranceId }, 'IRIS started speaking');
    return abortController;
  }

  /**
   * Completes an utterance normally.
   */
  finishSpeaking(conversationId: string, utteranceId?: string): void {
    const session = this.sessions.get(conversationId);
    if (!session) return;

    if (!utteranceId || session.activeUtteranceId === utteranceId) {
      session.isSpeaking = false;
      session.activeUtteranceId = undefined;
      session.abortController = undefined;

      this.emit('stateChange', {
        conversationId,
        state: 'IDLE' as AgentState,
      });

      logger.debug({ conversationId }, 'IRIS finished speaking');
    }
  }

  /**
   * Triggers an immediate barge-in interruption.
   * Cancels active TTS playback and signals interruption to all listeners.
   */
  interrupt(conversationId: string, reason = 'user_barge_in'): boolean {
    const session = this.sessions.get(conversationId);
    if (!session || !session.isSpeaking) {
      return false;
    }

    if (session.abortController) {
      session.abortController.abort();
    }

    const wasUtterance = session.activeUtteranceId;
    session.isSpeaking = false;
    session.activeUtteranceId = undefined;
    session.abortController = undefined;

    this.emit('interrupted', {
      conversationId,
      interruptedUtteranceId: wasUtterance,
      reason,
      timestamp: Date.now(),
    });

    this.emit('stateChange', {
      conversationId,
      state: 'INTERRUPTED' as AgentState,
      detail: `Interrupted due to: ${reason}`,
    });

    logger.info({ conversationId, wasUtterance, reason }, 'IRIS speech interrupted by user');
    return true;
  }

  isSpeaking(conversationId: string): boolean {
    return this.sessions.get(conversationId)?.isSpeaking || false;
  }

  clearSession(conversationId: string): void {
    this.interrupt(conversationId, 'session_cleared');
    this.sessions.delete(conversationId);
  }
}

export const speechStateManager = new SpeechStateManager();

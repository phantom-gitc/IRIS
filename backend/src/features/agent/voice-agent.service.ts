import { voiceAgentGraph, VoiceAgentStateType } from './langgraph/voice-agent.graph';
import { conversationService } from '../conversations/conversation.service';
import { AgentState } from './agent.state';
import { speechStateManager } from './realtime/speech-state.manager';

export interface VoiceCommandInput {
  userId: string;
  conversationId: string;
  audioInputBase64?: string;
  prompt?: string;
  confirmationToken?: string;
  taskId?: string;
  sttPreference?: 'groq' | 'sarvam';
  ttsPreference?: 'sarvam' | 'default';
}

export interface VoiceCommandOutput {
  conversationId: string;
  transcribedPrompt: string;
  userTranscript?: string;
  state: AgentState;
  response: string;
  audioOutputBase64?: string;
  audioBase64?: string;
  toolExecuted?: {
    toolName: string;
    summary?: string;
    success: boolean;
    data?: unknown;
  };
  requiresConfirmation?: {
    confirmationId: unknown;
    token: string;
    toolName: string;
    riskLevel: string;
    expiresAt: Date;
  };
}

export class VoiceAgentService {
  async processVoiceCommand(input: VoiceCommandInput): Promise<VoiceCommandOutput> {
    // 1. Immediate barge-in: cancel any currently speaking audio for this conversation
    speechStateManager.interrupt(input.conversationId, 'user_speech_start');

    const rawPrompt = input.prompt || '';

    // 2. Invoke LangGraph state machine
    const finalState = (await voiceAgentGraph.invoke({
      userId: input.userId,
      conversationId: input.conversationId,
      prompt: rawPrompt,
      audioInputBase64: input.audioInputBase64,
      confirmationToken: input.confirmationToken,
      taskId: input.taskId,
      sttPreference: input.sttPreference,
      ttsPreference: input.ttsPreference,
    })) as VoiceAgentStateType;

    const activePrompt = finalState.transcribedText || rawPrompt;

    // Persist user prompt if newly transcribed
    if (activePrompt) {
      await conversationService.addMessage(
        input.userId,
        input.conversationId,
        'user',
        activePrompt
      );
    }

    // Persist assistant reply & tool logs in conversation
    if (finalState.finalResponse) {
      const toolExec = finalState.toolResults && finalState.toolResults[0];
      await conversationService.addMessage(
        input.userId,
        input.conversationId,
        'assistant',
        finalState.finalResponse,
        finalState.toolCalls,
        toolExec
          ? [
              {
                toolCallId: toolExec.toolCallId,
                name: toolExec.name,
                result: toolExec.result,
                success: toolExec.success,
                error: toolExec.error,
              },
            ]
          : undefined
      );
    }

    const toolExecuted = finalState.toolResults?.[0]
      ? {
        toolName: finalState.toolResults[0].name,
        summary: finalState.toolResults[0].summary,
        success: finalState.toolResults[0].success,
        data: finalState.toolResults[0].result,
      }
      : undefined;

    return {
      conversationId: input.conversationId,
      transcribedPrompt: activePrompt,
      userTranscript: activePrompt,
      state: finalState.state,
      response: finalState.finalResponse,
      audioOutputBase64: finalState.audioOutputBase64,
      audioBase64: finalState.audioOutputBase64,
      toolExecuted,
      requiresConfirmation: finalState.requiresConfirmation,
    };
  }

  interruptSpeech(conversationId: string): boolean {
    return speechStateManager.interrupt(conversationId, 'manual_interrupt');
  }
}

export const voiceAgentService = new VoiceAgentService();

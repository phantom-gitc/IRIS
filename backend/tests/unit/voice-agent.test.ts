import { describe, it, expect, vi } from 'vitest';
import {
  transcribeNode,
  routeAfterPlan,
  routeAfterPermission,
  createVoiceAgentGraph,
  VoiceAgentStateType,
} from '../../src/features/agent/langgraph/voice-agent.graph';

describe('LangGraph Voice-to-Action State Machine', () => {
  it('transcribeNode uses text prompt directly when audio is absent', async () => {
    const state: VoiceAgentStateType = {
      userId: 'user_1',
      conversationId: 'conv_1',
      prompt: 'Check system status',
      confirmationToken: undefined,
      taskId: undefined,
      audioInputBase64: undefined,
      sttPreference: undefined,
      ttsPreference: undefined,
      transcribedText: '',
      toolCalls: [],
      toolResults: [],
      requiresConfirmation: undefined,
      finalResponse: '',
      audioOutputBase64: undefined,
      state: 'IDLE',
    };

    const result = await transcribeNode(state);
    expect(result.transcribedText).toBe('Check system status');
    expect(result.state).toBe('UNDERSTANDING');
  });

  it('routeAfterPlan routes to permissionGate when tool calls exist', () => {
    const state = {
      toolCalls: [{ id: 'call_1', name: 'systemInfo', args: {} }],
    } as any;

    expect(routeAfterPlan(state)).toBe('permissionGate');
  });

  it('routeAfterPlan routes directly to voiceTTS when no tool calls are needed', () => {
    const state = {
      toolCalls: [],
    } as any;

    expect(routeAfterPlan(state)).toBe('voiceTTS');
  });

  it('routeAfterPermission routes to voiceTTS if confirmation is required', () => {
    const state = {
      requiresConfirmation: { token: 'token_123' },
      state: 'CONFIRMING',
    } as any;

    expect(routeAfterPermission(state)).toBe('voiceTTS');
  });

  it('routeAfterPermission routes to executeTools when permission is granted', () => {
    const state = {
      requiresConfirmation: undefined,
      state: 'EXECUTING',
    } as any;

    expect(routeAfterPermission(state)).toBe('executeTools');
  });

  it('createVoiceAgentGraph compiles successfully without errors', () => {
    const graph = createVoiceAgentGraph();
    expect(graph).toBeDefined();
    expect(typeof graph.invoke).toBe('function');
  });
});

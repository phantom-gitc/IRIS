import { Annotation, StateGraph, START, END } from '@langchain/langgraph';
import { AgentState } from '../agent.state';
import { AgentContextBuilder } from '../agent.context';
import { getLLMProvider } from '../providers/llm';
import { toolRegistry } from '../../tools/tool.registry';
import { permissionService } from '../../permissions/permission.service';
import { ToolExecution } from '../../tools/tool-execution.model';
import { getTTSProvider } from '../providers/tts';
import { getSTTProvider } from '../providers/stt';
import { logger } from '../../../config/logger';
import { PersonalityPolicy } from '../personality/personality.policy';
import { TaskContextManager } from '../task-context.manager';
import { speechStateManager } from '../realtime/speech-state.manager';

export interface VoiceToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface VoiceToolResult {
  toolCallId: string;
  name: string;
  result?: unknown;
  success: boolean;
  error?: string;
  summary?: string;
}

export const VoiceAgentAnnotation = Annotation.Root({
  userId: Annotation<string>(),
  conversationId: Annotation<string>(),
  prompt: Annotation<string>(),
  confirmationToken: Annotation<string | undefined>(),
  taskId: Annotation<string | undefined>(),
  audioInputBase64: Annotation<string | undefined>(),
  sttPreference: Annotation<'groq' | 'sarvam' | undefined>(),
  ttsPreference: Annotation<'sarvam' | 'default' | undefined>(),

  transcribedText: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => '',
  }),
  toolCalls: Annotation<VoiceToolCall[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  toolResults: Annotation<VoiceToolResult[]>({
    reducer: (prev, next) => prev.concat(next),
    default: () => [],
  }),
  requiresConfirmation: Annotation<any | undefined>(),
  finalResponse: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => '',
  }),
  audioOutputBase64: Annotation<string | undefined>(),
  state: Annotation<AgentState>({
    reducer: (_prev, next) => next,
    default: () => 'IDLE',
  }),
});

export type VoiceAgentStateType = typeof VoiceAgentAnnotation.State;

// Node 1: Transcribe voice audio if audio is provided
export async function transcribeNode(state: VoiceAgentStateType): Promise<Partial<VoiceAgentStateType>> {
  let promptText = state.prompt;

  if (state.audioInputBase64) {
    try {
      const buffer = Buffer.from(state.audioInputBase64, 'base64');
      const stt = getSTTProvider(state.sttPreference);
      const result = await stt.transcribe(buffer, 'command.webm');
      promptText = result.text.trim();
    } catch (err) {
      logger.warn({ error: (err as Error).message }, 'STT transcription failed, falling back to text prompt');
    }
  }

  // Resolve pronouns & contextual references (e.g. "the dashboard", "that file")
  const resolvedPrompt = TaskContextManager.resolveContextReferences(state.conversationId, promptText);

  return {
    transcribedText: resolvedPrompt,
    prompt: resolvedPrompt,
    state: 'UNDERSTANDING',
  };
}

// Node 2: Plan actions using LLM with tools schema
export async function planNode(state: VoiceAgentStateType): Promise<Partial<VoiceAgentStateType>> {
  const activePrompt = (state.transcribedText || state.prompt || '').trim();

  if (!activePrompt) {
    return {
      finalResponse: "I'm listening. How can I help you today, boss?",
      state: 'SPEAKING',
    };
  }

  const messages = await AgentContextBuilder.buildContext(
    state.userId,
    state.conversationId,
    activePrompt
  );

  const llm = getLLMProvider();
  const llmResult = await llm.complete(messages, {
    tools: toolRegistry.getLLMTools(),
  });

  if (llmResult.toolCalls && llmResult.toolCalls.length > 0) {
    return {
      toolCalls: llmResult.toolCalls,
      state: 'PLANNING',
    };
  }

  const rawResponse = llmResult.content || 'I have completed your request.';

  // Check if response contains nickname or flirt to update cooldowns
  const lowerResp = rawResponse.toLowerCase();
  const usedNickname = ['boss', 'buddy', 'dear', 'handsome'].find((n) => lowerResp.includes(n));
  const usedFlirt = /\b(blush|cute|handsome|date|distracted)\b/i.test(lowerResp);
  PersonalityPolicy.recordPersonalityUsage(usedNickname, usedFlirt);

  return {
    finalResponse: rawResponse,
    state: 'SPEAKING',
  };
}

// Node 3: Permission Gate & Confirmation
export async function permissionGateNode(state: VoiceAgentStateType): Promise<Partial<VoiceAgentStateType>> {
  if (state.toolCalls.length === 0) {
    return {};
  }

  const toolCall = state.toolCalls[0]!;
  const tool = toolRegistry.get(toolCall.name);

  if (!tool) {
    return {
      finalResponse: `I couldn't find the requested tool '${toolCall.name}'.`,
      state: 'ERROR',
    };
  }

  try {
    await permissionService.authorizeToolExecution(
      state.userId,
      tool,
      toolCall.args,
      { confirmationToken: state.confirmationToken, taskId: state.taskId }
    );
    return { state: 'EXECUTING' };
  } catch (err: any) {
    if (err.details?.token) {
      return {
        requiresConfirmation: err.details,
        // Confirmation requests must remain clear, objective, and without flirtation
        finalResponse: `IRIS requires your confirmation before proceeding with '${tool.name}'.`,
        state: 'CONFIRMING',
      };
    }
    const humanError = PersonalityPolicy.translateError(err.message || 'Permission denied');
    return {
      finalResponse: humanError,
      state: 'ERROR',
    };
  }
}

export function sanitizeTextForSpeech(text: string): string {
  if (!text) return '';
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // markdown links
    .replace(/https?:\/\/\S+/g, '') // raw urls
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1') // bold/italic
    .replace(/[*#~`_]/g, '') // stray asterisks, hashes, backticks
    .replace(/^[\s]*[-+*]\s+/gm, '') // bullet lists
    .replace(/^#+\s+/gm, '') // headings
    .replace(/\s+/g, ' ')
    .trim();
}

// Node 4: Execute Tools & Audit (All tool calls)
export async function executeToolsNode(state: VoiceAgentStateType): Promise<Partial<VoiceAgentStateType>> {
  const toolResults: VoiceToolResult[] = [];

  for (const toolCall of state.toolCalls) {
    const start = Date.now();
    const execResult = await toolRegistry.execute(toolCall.name, toolCall.args, {
      userId: state.userId,
      conversationId: state.conversationId,
      taskId: state.taskId,
    });
    const durationMs = Date.now() - start;

    await ToolExecution.create({
      userId: state.userId,
      conversationId: state.conversationId,
      taskId: state.taskId,
      toolName: toolCall.name,
      input: toolCall.args,
      output: execResult.data as Record<string, unknown>,
      status: execResult.success ? 'SUCCESS' : 'FAILED',
      durationMs,
      error: execResult.error,
    });

    TaskContextManager.updateContext(state.conversationId, {
      lastToolName: toolCall.name,
      lastToolResultSummary: execResult.summary,
      activeTaskId: state.taskId,
    });

    toolResults.push({
      toolCallId: toolCall.id,
      name: toolCall.name,
      result: execResult.data,
      success: execResult.success,
      error: execResult.error,
      summary: execResult.summary,
    });
  }

  return {
    toolResults,
    state: 'EXECUTING',
  };
}

// Node 5: Verify & Synthesize Response
export async function verifyAndSynthesizeNode(state: VoiceAgentStateType): Promise<Partial<VoiceAgentStateType>> {
  if (state.toolResults.length > 0) {
    const llm = getLLMProvider();
    const messages = await AgentContextBuilder.buildContext(
      state.userId,
      state.conversationId,
      state.transcribedText || state.prompt,
      { isError: state.toolResults.some((r) => !r.success) }
    );

    for (const res of state.toolResults) {
      messages.push({
        role: 'assistant',
        content: `Executed tool ${res.name}: ${res.summary}`,
      });
      messages.push({
        role: 'tool',
        content: JSON.stringify(res),
        toolCallId: res.toolCallId,
      });
    }

    const finalLLM = await llm.complete(messages);
    const lastResult = state.toolResults[state.toolResults.length - 1]!;
    let synthesized = finalLLM.content || lastResult.summary || 'Actions completed successfully.';

    synthesized = PersonalityPolicy.verifyNoFakeAction(synthesized, {
      success: lastResult.success,
      toolName: lastResult.name,
      summary: lastResult.summary,
      error: lastResult.error,
    });

    return {
      finalResponse: synthesized,
      state: 'SPEAKING',
    };
  }

  return { state: 'SPEAKING' };
}

// Node 6: Voice TTS Node
export async function voiceTTSNode(state: VoiceAgentStateType): Promise<Partial<VoiceAgentStateType>> {
  if (!state.finalResponse) {
    return { state: 'SUCCESS' };
  }

  try {
    const utteranceId = `utt-${Date.now()}`;
    speechStateManager.startSpeaking(state.conversationId, utteranceId);

    // Sanitize markdown and asterisks before speaking
    const speechText = sanitizeTextForSpeech(state.finalResponse);

    const tts = getTTSProvider(state.ttsPreference);
    const ttsResult = await tts.synthesize(speechText || state.finalResponse);

    speechStateManager.finishSpeaking(state.conversationId, utteranceId);

    return {
      audioOutputBase64: ttsResult.audioBuffer.toString('base64'),
      state: 'SUCCESS',
    };
  } catch (err) {
    logger.warn({ error: (err as Error).message }, 'TTS synthesis skipped in voice graph');
    return { state: 'SUCCESS' };
  }
}

// Conditional routing edge
export function routeAfterPlan(state: VoiceAgentStateType): string {
  if (state.toolCalls && state.toolCalls.length > 0) {
    return 'permissionGate';
  }
  return 'voiceTTS';
}

export function routeAfterPermission(state: VoiceAgentStateType): string {
  if (state.requiresConfirmation || state.state === 'ERROR') {
    return 'voiceTTS';
  }
  return 'executeTools';
}

// Build the compiled LangGraph StateGraph
export function createVoiceAgentGraph() {
  const workflow = new StateGraph(VoiceAgentAnnotation)
    .addNode('transcribe', transcribeNode)
    .addNode('plan', planNode)
    .addNode('permissionGate', permissionGateNode)
    .addNode('executeTools', executeToolsNode)
    .addNode('verifyAndSynthesize', verifyAndSynthesizeNode)
    .addNode('voiceTTS', voiceTTSNode)
    .addEdge(START, 'transcribe')
    .addEdge('transcribe', 'plan')
    .addConditionalEdges('plan', routeAfterPlan, {
      permissionGate: 'permissionGate',
      voiceTTS: 'voiceTTS',
    })
    .addConditionalEdges('permissionGate', routeAfterPermission, {
      executeTools: 'executeTools',
      voiceTTS: 'voiceTTS',
    })
    .addEdge('executeTools', 'verifyAndSynthesize')
    .addEdge('verifyAndSynthesize', 'voiceTTS')
    .addEdge('voiceTTS', END);

  return workflow.compile();
}

export const voiceAgentGraph = createVoiceAgentGraph();

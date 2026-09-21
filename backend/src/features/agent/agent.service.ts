import { AgentContextBuilder } from './agent.context';
import { getLLMProvider } from './providers/llm';
import { toolRegistry } from '../tools/tool.registry';
import { permissionService } from '../permissions/permission.service';
import { conversationService } from '../conversations/conversation.service';
import { ToolExecution } from '../tools/tool-execution.model';
import { AgentState } from './agent.state';
import { PersonalityPolicy } from './personality/personality.policy';
import { TaskContextManager } from './task-context.manager';

export interface AgentChatInput {
  userId: string;
  conversationId: string;
  prompt: string;
  confirmationToken?: string;
  taskId?: string;
}

export interface AgentChatResponse {
  conversationId: string;
  state: AgentState;
  response: string;
  toolExecuted?: {
    toolName: string;
    summary: string;
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

export class AgentService {
  async processUserMessage(input: AgentChatInput): Promise<AgentChatResponse> {
    const { userId, conversationId, prompt } = input;

    // 1. Resolve context references (e.g. "that file", "the dashboard")
    const resolvedPrompt = TaskContextManager.resolveContextReferences(conversationId, prompt);

    // 2. Record incoming user message in conversation
    await conversationService.addMessage(userId, conversationId, 'user', resolvedPrompt);

    // 3. Build bounded context with personality guidance
    const messages = await AgentContextBuilder.buildContext(userId, conversationId, resolvedPrompt);
    const llm = getLLMProvider();

    // 4. Request completion from LLM with tool schemas
    const llmResult = await llm.complete(messages, {
      tools: toolRegistry.getLLMTools(),
    });

    // 5. Handle tool execution if requested by the LLM
    if (llmResult.toolCalls && llmResult.toolCalls.length > 0) {
      const executedToolCalls: any[] = [];
      const executedResults: any[] = [];

      for (const toolCall of llmResult.toolCalls) {
        const tool = toolRegistry.get(toolCall.name);
        if (!tool) continue;

        try {
          await permissionService.authorizeToolExecution(
            userId,
            tool,
            toolCall.args,
            { confirmationToken: input.confirmationToken, taskId: input.taskId }
          );
        } catch (permError: any) {
          if (permError.details?.token) {
            return {
              conversationId,
              state: 'CONFIRMING',
              response: `IRIS requires your confirmation before proceeding with '${tool.name}'.`,
              requiresConfirmation: permError.details,
            };
          }
          const humanError = PersonalityPolicy.translateError(permError);
          return {
            conversationId,
            state: 'ERROR',
            response: humanError,
          };
        }

        const start = Date.now();
        const execResult = await toolRegistry.execute(toolCall.name, toolCall.args, {
          userId,
          conversationId,
          taskId: input.taskId,
        });
        const durationMs = Date.now() - start;

        await ToolExecution.create({
          userId,
          conversationId,
          taskId: input.taskId,
          toolName: tool.name,
          input: toolCall.args,
          output: execResult.data as Record<string, unknown>,
          status: execResult.success ? 'SUCCESS' : 'FAILED',
          durationMs,
          error: execResult.error,
        });

        TaskContextManager.updateContext(conversationId, {
          lastToolName: tool.name,
          lastToolResultSummary: execResult.summary,
          activeTaskId: input.taskId,
        });

        messages.push({
          role: 'assistant',
          content: `Executed tool ${tool.name}: ${execResult.summary}`,
        });
        messages.push({
          role: 'tool',
          content: JSON.stringify(execResult),
          toolCallId: toolCall.id,
        });

        executedToolCalls.push(toolCall);
        executedResults.push({
          toolCallId: toolCall.id,
          name: tool.name,
          result: execResult.data,
          success: execResult.success,
          error: execResult.error,
          summary: execResult.summary,
        });
      }

      const finalLLM = await llm.complete(messages);
      const lastResult = executedResults[executedResults.length - 1];
      let finalContent = finalLLM.content || lastResult?.summary || 'Actions completed successfully.';

      if (lastResult) {
        finalContent = PersonalityPolicy.verifyNoFakeAction(finalContent, {
          success: lastResult.success,
          toolName: lastResult.name,
          summary: lastResult.summary,
          error: lastResult.error,
        });
      }

      await conversationService.addMessage(
        userId,
        conversationId,
        'assistant',
        finalContent,
        executedToolCalls,
        executedResults
      );

      const allSuccess = executedResults.every((r) => r.success);
      return {
        conversationId,
        state: allSuccess ? 'SUCCESS' : 'ERROR',
        response: finalContent,
        toolExecuted: lastResult ? {
          toolName: lastResult.name,
          summary: lastResult.summary,
          success: lastResult.success,
          data: lastResult.result,
        } : undefined,
      };
    }

    // 6. Normal conversational response without tools
    const rawReply = llmResult.content || 'I am ready to help you with your computer and projects.';

    // Update cooldown timers for nicknames & flirts
    const lowerReply = rawReply.toLowerCase();
    const usedNickname = ['boss', 'buddy', 'dear', 'handsome'].find((n) => lowerReply.includes(n));
    const usedFlirt = /\b(blush|cute|handsome|date|distracted)\b/i.test(lowerReply);
    PersonalityPolicy.recordPersonalityUsage(usedNickname, usedFlirt);

    await conversationService.addMessage(userId, conversationId, 'assistant', rawReply);

    return {
      conversationId,
      state: 'SPEAKING',
      response: rawReply,
    };
  }
}

export const agentService = new AgentService();

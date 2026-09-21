import { Router } from 'express';
import { ApiResponse } from '../shared/types';
import { authRouter } from '../features/auth/auth.routes';
import { memoryRouter } from '../features/memory/memory.routes';
import { realtimeRouter } from '../features/realtime/realtime.routes';
import { conversationRouter } from '../features/conversations/conversation.routes';
import { taskRouter } from '../features/tasks/task.routes';
import { agentRouter } from '../features/agent/agent.routes';
import { confirmationRouter } from '../features/confirmations/confirmation.routes';
import { auditRouter } from '../features/audit/audit.routes';
import { toolRouter } from '../features/tools/tool.routes';

export const v1Router = Router();

// Base health/meta check for API v1
v1Router.get('/', (_req, res) => {
  const response: ApiResponse<{ api: string; version: string }> = {
    success: true,
    data: {
      api: 'IRIS Modular Monolith Backend',
      version: 'v1',
    },
  };
  res.json(response);
});

// Authentication routes
v1Router.use('/auth', authRouter);

// Memory routes
v1Router.use('/memories', memoryRouter);

// Realtime communication routes
v1Router.use('/realtime', realtimeRouter);

// Conversation routes
v1Router.use('/conversations', conversationRouter);

// Task routes
v1Router.use('/tasks', taskRouter);

// Agent execution routes
v1Router.use('/agent', agentRouter);

// Confirmation routes
v1Router.use('/confirmations', confirmationRouter);

// Audit routes
v1Router.use('/audit', auditRouter);

// Tools introspection routes
v1Router.use('/tools', toolRouter);


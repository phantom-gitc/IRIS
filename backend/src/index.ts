import 'dotenv/config';
import { startServer } from './app/server';
import { logger } from './config/logger';

export * from './shared/types';
export * from './shared/errors';
export { env, loadConfig } from './config/env';
export { logger } from './config/logger';
export { connectDatabase, disconnectDatabase, checkDatabaseHealth } from './config/database';
export { User } from './features/users/user.model';
export { Session } from './features/sessions/session.model';
export { Conversation } from './features/conversations/conversation.model';
export { Message } from './features/conversations/message.model';
export { Memory } from './features/memory/memory.model';
export { Task } from './features/tasks/task.model';
export { ToolExecution } from './features/tools/tool-execution.model';
export { Confirmation } from './features/confirmations/confirmation.model';
export { AuditLog } from './features/audit/audit.model';
export { createApp } from './app/app';
export { startServer } from './app/server';

startServer().catch((err) => {
  logger.fatal({ error: err?.message }, 'Failed to start server');
});


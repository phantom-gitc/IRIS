import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import { User } from '../../src/features/users/user.model';
import { Session } from '../../src/features/sessions/session.model';
import { Conversation } from '../../src/features/conversations/conversation.model';
import { Message } from '../../src/features/conversations/message.model';
import { Memory } from '../../src/features/memory/memory.model';
import { Task } from '../../src/features/tasks/task.model';
import { ToolExecution } from '../../src/features/tools/tool-execution.model';
import { Confirmation } from '../../src/features/confirmations/confirmation.model';
import { AuditLog } from '../../src/features/audit/audit.model';

describe('Mongoose Models Schema Validation', () => {
  const dummyUserId = new mongoose.Types.ObjectId();
  const dummyConversationId = new mongoose.Types.ObjectId();
  const dummyTaskId = new mongoose.Types.ObjectId();

  describe('User Model', () => {
    it('validates a correct user and strips passwordHash in toJSON', async () => {
      const user = new User({
        email: 'TEST@EXAMPLE.COM',
        passwordHash: '$argon2id$v=19$m=19456,t=2,p=1$fakehash',
        name: 'Test User',
      });

      await expect(user.validate()).resolves.toBeUndefined();
      expect(user.email).toBe('test@example.com'); // Lowercase transform

      const json = user.toJSON();
      expect(json.passwordHash).toBeUndefined();
      expect(json.__v).toBeUndefined();
      expect(json.email).toBe('test@example.com');
      expect(json.name).toBe('Test User');
    });

    it('requires email, passwordHash, and name', async () => {
      const user = new User({});
      await expect(user.validate()).rejects.toThrow(/validation failed/i);
    });
  });

  describe('Session Model', () => {
    it('validates a correct session and strips refreshTokenHash in toJSON', async () => {
      const session = new Session({
        userId: dummyUserId,
        refreshTokenHash: 'hashed_refresh_token_string',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      await expect(session.validate()).resolves.toBeUndefined();
      expect(session.isRevoked).toBe(false);

      const json = session.toJSON();
      expect(json.refreshTokenHash).toBeUndefined();
    });

    it('requires userId and refreshTokenHash', async () => {
      const session = new Session({});
      await expect(session.validate()).rejects.toThrow(/validation failed/i);
    });
  });

  describe('Conversation Model', () => {
    it('defaults status to active and title to New Conversation', async () => {
      const conv = new Conversation({
        userId: dummyUserId,
      });

      await expect(conv.validate()).resolves.toBeUndefined();
      expect(conv.status).toBe('active');
      expect(conv.title).toBe('New Conversation');
    });
  });

  describe('Message Model', () => {
    it('validates correct message with tool calls', async () => {
      const msg = new Message({
        conversationId: dummyConversationId,
        userId: dummyUserId,
        role: 'assistant',
        content: 'I will create the folder for you.',
        toolCalls: [
          {
            id: 'tc_123',
            name: 'createFolder',
            args: { path: 'src/components' },
          },
        ],
      });

      await expect(msg.validate()).resolves.toBeUndefined();
      expect(msg.role).toBe('assistant');
      expect(msg.toolCalls).toHaveLength(1);
    });

    it('rejects invalid role', async () => {
      const msg = new Message({
        conversationId: dummyConversationId,
        userId: dummyUserId,
        role: 'invalid_role' as any,
      });

      await expect(msg.validate()).rejects.toThrow();
    });
  });

  describe('Memory Model', () => {
    it('validates all allowed memory types', async () => {
      const types = [
        'WORKING_MEMORY',
        'CONVERSATION_MEMORY',
        'EPISODIC_MEMORY',
        'PERSONAL_MEMORY',
        'PROJECT_MEMORY',
      ] as const;

      for (const t of types) {
        const memory = new Memory({
          userId: dummyUserId,
          content: 'User prefers dark mode and TypeScript',
          memoryType: t,
          importance: 8,
          tags: ['preference', 'ui'],
        });

        await expect(memory.validate()).resolves.toBeUndefined();
      }
    });

    it('rejects invalid memoryType', async () => {
      const memory = new Memory({
        userId: dummyUserId,
        content: 'Test',
        memoryType: 'INVALID_TYPE' as any,
      });

      await expect(memory.validate()).rejects.toThrow();
    });
  });

  describe('Task Model', () => {
    it('defaults status to PENDING and progress to 0', async () => {
      const task = new Task({
        userId: dummyUserId,
        title: 'Setup React Component',
      });

      await expect(task.validate()).resolves.toBeUndefined();
      expect(task.status).toBe('PENDING');
      expect(task.progress).toBe(0);
    });
  });

  describe('ToolExecution Model', () => {
    it('validates tool execution record', async () => {
      const execution = new ToolExecution({
        userId: dummyUserId,
        taskId: dummyTaskId,
        toolName: 'readFile',
        input: { path: 'package.json' },
        status: 'SUCCESS',
        durationMs: 14,
      });

      await expect(execution.validate()).resolves.toBeUndefined();
      expect(execution.status).toBe('SUCCESS');
    });
  });

  describe('Confirmation Model', () => {
    it('validates confirmation token and defaults to CONFIRM risk level', async () => {
      const conf = new Confirmation({
        userId: dummyUserId,
        toolName: 'npmInstall',
        inputPayload: { package: 'lodash' },
        token: 'token_abc_123',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });

      await expect(conf.validate()).resolves.toBeUndefined();
      expect(conf.riskLevel).toBe('CONFIRM');
      expect(conf.status).toBe('PENDING');
    });
  });

  describe('AuditLog Model', () => {
    it('validates audit log entry', async () => {
      const audit = new AuditLog({
        userId: dummyUserId,
        requestId: 'req_123',
        action: 'AUTH_LOGIN',
        resource: '/api/v1/auth/login',
        status: 'SUCCESS',
      });

      await expect(audit.validate()).resolves.toBeUndefined();
      expect(audit.timestamp).toBeInstanceOf(Date);
    });
  });
});

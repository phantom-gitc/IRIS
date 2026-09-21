import { AuditLog, AuditStatus } from './audit.model';
import { logger } from '../../config/logger';

export class AuditService {
  async record(params: {
    userId?: string;
    sessionId?: string;
    requestId: string;
    action: string;
    resource: string;
    status: AuditStatus;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      // Safe metadata copy with sensitive fields stripped
      const safeMeta = { ...(params.metadata || {}) };
      delete safeMeta.password;
      delete safeMeta.token;
      delete safeMeta.refreshToken;
      delete safeMeta.secret;

      await AuditLog.create({
        userId: params.userId,
        sessionId: params.sessionId,
        requestId: params.requestId,
        action: params.action,
        resource: params.resource,
        status: params.status,
        metadata: safeMeta,
        ipAddress: params.ipAddress || '',
        userAgent: params.userAgent || '',
        timestamp: new Date(),
      });
    } catch (err) {
      logger.warn({ error: (err as Error).message }, 'Failed to record audit log');
    }
  }

  async listLogs(
    userId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<{ logs: any[]; total: number }> {
    const limit = Math.min(options?.limit || 50, 100);
    const offset = options?.offset || 0;

    const [logs, total] = await Promise.all([
      AuditLog.find({ userId })
        .sort({ timestamp: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments({ userId }),
    ]);

    return { logs, total };
  }
}

export const auditService = new AuditService();

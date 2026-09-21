import { ToolDefinition } from '../tools/tool.types';
import { confirmationService } from '../confirmations/confirmation.service';
import { PermissionDeniedError } from '../../shared/errors';
import { IConfirmation } from '../confirmations/confirmation.model';

export interface PermissionCheckResult {
  allowed: boolean;
  requiresConfirmation?: boolean;
  confirmation?: IConfirmation;
}

export class PermissionService {
  async authorizeToolExecution(
    userId: string,
    tool: ToolDefinition,
    inputPayload: Record<string, unknown>,
    options?: { confirmationToken?: string; taskId?: string }
  ): Promise<PermissionCheckResult> {
    if (tool.permissionLevel === 'SAFE') {
      return { allowed: true };
    }

    // Tool requires explicit confirmation
    if (options?.confirmationToken) {
      const isApproved = await confirmationService.verifyAndConsumeApproval(
        userId,
        tool.name,
        options.confirmationToken
      );
      if (isApproved) {
        return { allowed: true };
      }
    }

    // Create confirmation request for user approval
    const confirmation = await confirmationService.createConfirmation(
      userId,
      tool.name,
      inputPayload,
      tool.permissionLevel,
      options?.taskId
    );

    throw new PermissionDeniedError(
      `Execution of '${tool.name}' requires user confirmation [Risk: ${tool.permissionLevel}]`,
      {
        confirmationId: confirmation._id,
        token: confirmation.token,
        toolName: tool.name,
        riskLevel: tool.permissionLevel,
        expiresAt: confirmation.expiresAt,
      }
    );
  }
}

export const permissionService = new PermissionService();

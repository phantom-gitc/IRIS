import { nanoid } from 'nanoid';
import { Confirmation, IConfirmation, ConfirmationRiskLevel } from './confirmation.model';
import { NotFoundError, PermissionDeniedError, ValidationError } from '../../shared/errors';

export class ConfirmationService {
  async createConfirmation(
    userId: string,
    toolName: string,
    inputPayload: Record<string, unknown>,
    riskLevel: ConfirmationRiskLevel,
    taskId?: string
  ): Promise<IConfirmation> {
    const token = `conf_${nanoid(32)}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    return Confirmation.create({
      userId,
      toolName,
      inputPayload,
      riskLevel,
      status: 'PENDING',
      token,
      expiresAt,
      taskId,
    });
  }

  async approveConfirmation(userId: string, token: string): Promise<IConfirmation> {
    const conf = await Confirmation.findOne({ token, userId });
    if (!conf) {
      throw new NotFoundError('Confirmation request not found');
    }

    if (conf.status !== 'PENDING') {
      throw new ValidationError(`Confirmation request has already been ${conf.status.toLowerCase()}`);
    }

    if (new Date() > conf.expiresAt) {
      conf.status = 'EXPIRED';
      await conf.save();
      throw new ValidationError('Confirmation request has expired');
    }

    conf.status = 'APPROVED';
    conf.approvedAt = new Date();
    await conf.save();

    return conf;
  }

  async rejectConfirmation(userId: string, token: string): Promise<IConfirmation> {
    const conf = await Confirmation.findOne({ token, userId });
    if (!conf) {
      throw new NotFoundError('Confirmation request not found');
    }

    conf.status = 'REJECTED';
    conf.rejectedAt = new Date();
    await conf.save();

    return conf;
  }

  async verifyAndConsumeApproval(userId: string, toolName: string, token: string): Promise<boolean> {
    const conf = await Confirmation.findOne({ token, userId, toolName });
    if (!conf || conf.status !== 'APPROVED') {
      throw new PermissionDeniedError('Action requires valid explicit user confirmation');
    }

    // Single-use token: remove once verified
    await Confirmation.deleteOne({ _id: conf._id });
    return true;
  }
}

export const confirmationService = new ConfirmationService();

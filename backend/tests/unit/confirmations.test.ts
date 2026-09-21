import { describe, it, expect, vi } from 'vitest';
import mongoose from 'mongoose';
import { confirmationService } from '../../src/features/confirmations/confirmation.service';
import { Confirmation } from '../../src/features/confirmations/confirmation.model';

describe('Confirmation Service', () => {
  it('creates, approves, and verifies single-use confirmation token', async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const mockConf = {
      _id: new mongoose.Types.ObjectId(),
      userId,
      toolName: 'npmInstall',
      token: 'conf_mock_123',
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(Confirmation, 'create').mockResolvedValue(mockConf as any);
    vi.spyOn(Confirmation, 'findOne').mockResolvedValue(mockConf as any);
    vi.spyOn(Confirmation, 'deleteOne').mockResolvedValue({ deletedCount: 1 } as any);

    const conf = await confirmationService.createConfirmation(
      userId,
      'npmInstall',
      { package: 'express' },
      'CONFIRM'
    );

    expect(conf.status).toBe('PENDING');

    // Approve
    const approved = await confirmationService.approveConfirmation(userId, conf.token);
    expect(approved.status).toBe('APPROVED');

    // Verify & consume single-use token
    const isConsumed = await confirmationService.verifyAndConsumeApproval(
      userId,
      'npmInstall',
      conf.token
    );
    expect(isConsumed).toBe(true);
  });
});

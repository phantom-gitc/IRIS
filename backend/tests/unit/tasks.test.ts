import { describe, it, expect, vi } from 'vitest';
import mongoose from 'mongoose';
import { taskService } from '../../src/features/tasks/task.service';
import { Task } from '../../src/features/tasks/task.model';

describe('Task Engine Service', () => {
  it('manages task state transitions and in-flight cancellation', async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const taskId = new mongoose.Types.ObjectId().toString();

    const mockTask = {
      _id: taskId,
      userId,
      title: 'Build Component Workflow',
      status: 'PENDING',
      progress: 0,
      steps: [] as any[],
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(Task, 'create').mockResolvedValue(mockTask as any);
    vi.spyOn(Task, 'findOne').mockResolvedValue(mockTask as any);

    const task = await taskService.createTask(userId, 'Build Component Workflow');
    expect(task.status).toBe('PENDING');

    // Start task
    const running = await taskService.startTask(userId, taskId);
    expect(running.status).toBe('RUNNING');

    // Update progress
    const inProgress = await taskService.updateProgress(userId, taskId, 50, {
      id: 'step_1',
      title: 'Analyze project structure',
      status: 'COMPLETED',
    });
    expect(inProgress.progress).toBe(50);
    expect(inProgress.steps).toHaveLength(1);

    // Cancel task
    const cancelled = await taskService.cancelTask(userId, taskId);
    expect(cancelled.status).toBe('CANCELLED');
  });
});

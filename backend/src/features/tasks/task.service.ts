import { Task, ITask, ITaskStep } from './task.model';
import { NotFoundError, ValidationError } from '../../shared/errors';
import { logger } from '../../config/logger';

export class TaskService {
  // Store in-memory AbortControllers for active tasks
  private activeControllers = new Map<string, AbortController>();

  getAbortSignal(taskId: string): AbortSignal | undefined {
    return this.activeControllers.get(taskId)?.signal;
  }

  async createTask(
    userId: string,
    title: string,
    description?: string,
    conversationId?: string
  ): Promise<ITask> {
    const task = await Task.create({
      userId,
      title,
      description: description || '',
      conversationId,
      status: 'PENDING',
      progress: 0,
      steps: [],
    });

    const controller = new AbortController();
    this.activeControllers.set(task._id.toString(), controller);

    return task;
  }

  async startTask(userId: string, taskId: string): Promise<ITask> {
    const task = await Task.findOne({ _id: taskId, userId });
    if (!task) throw new NotFoundError('Task not found');

    task.status = 'RUNNING';
    task.startedAt = new Date();
    await task.save();

    if (!this.activeControllers.has(taskId)) {
      this.activeControllers.set(taskId, new AbortController());
    }

    return task;
  }

  async updateProgress(
    userId: string,
    taskId: string,
    progress: number,
    newStep?: ITaskStep
  ): Promise<ITask> {
    const task = await Task.findOne({ _id: taskId, userId });
    if (!task) throw new NotFoundError('Task not found');

    task.progress = Math.min(100, Math.max(0, progress));
    if (newStep) {
      task.steps.push(newStep);
    }
    await task.save();
    return task;
  }

  async completeTask(userId: string, taskId: string): Promise<ITask> {
    const task = await Task.findOne({ _id: taskId, userId });
    if (!task) throw new NotFoundError('Task not found');

    task.status = 'COMPLETED';
    task.progress = 100;
    task.completedAt = new Date();
    await task.save();

    this.activeControllers.delete(taskId);
    return task;
  }

  async failTask(userId: string, taskId: string, error: { code: string; message: string; details?: unknown }): Promise<ITask> {
    const task = await Task.findOne({ _id: taskId, userId });
    if (!task) throw new NotFoundError('Task not found');

    task.status = 'FAILED';
    task.error = error;
    task.completedAt = new Date();
    await task.save();

    this.activeControllers.delete(taskId);
    return task;
  }

  async cancelTask(userId: string, taskId: string): Promise<ITask> {
    const task = await Task.findOne({ _id: taskId, userId });
    if (!task) throw new NotFoundError('Task not found');

    if (task.status === 'COMPLETED' || task.status === 'FAILED') {
      throw new ValidationError(`Cannot cancel task that is already ${task.status.toLowerCase()}`);
    }

    // Trigger abort signal to cancel running tools and processes
    const controller = this.activeControllers.get(taskId);
    if (controller) {
      controller.abort();
      this.activeControllers.delete(taskId);
      logger.info({ taskId, userId }, 'Aborted in-flight execution for task');
    }

    task.status = 'CANCELLED';
    task.completedAt = new Date();
    await task.save();

    return task;
  }

  async getTasks(userId: string, limit = 20): Promise<ITask[]> {
    return Task.find({ userId }).sort({ createdAt: -1 }).limit(limit).exec();
  }

  async getTask(userId: string, taskId: string): Promise<ITask> {
    const task = await Task.findOne({ _id: taskId, userId });
    if (!task) throw new NotFoundError('Task not found');
    return task;
  }
}

export const taskService = new TaskService();

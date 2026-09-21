import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type TaskStatus =
  | 'PENDING'
  | 'PLANNING'
  | 'RUNNING'
  | 'WAITING_CONFIRMATION'
  | 'PAUSED'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface ITaskStep {
  id: string;
  title: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  toolName?: string;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface ITask extends Document {
  userId: Types.ObjectId;
  conversationId?: Types.ObjectId;
  title: string;
  description?: string;
  status: TaskStatus;
  progress: number; // 0 - 100
  steps: ITaskStep[];
  toolExecutionIds: Types.ObjectId[];
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  metadata: Record<string, unknown>;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TaskStepSchema = new Schema<ITaskStep>(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'SKIPPED'],
      default: 'PENDING',
    },
    toolName: String,
    error: String,
    startedAt: Date,
    completedAt: Date,
  },
  { _id: false }
);

const TaskSchema = new Schema<ITask>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: [
        'PENDING',
        'PLANNING',
        'RUNNING',
        'WAITING_CONFIRMATION',
        'PAUSED',
        'COMPLETED',
        'FAILED',
        'CANCELLED',
      ],
      default: 'PENDING',
      index: true,
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    steps: {
      type: [TaskStepSchema],
      default: [],
    },
    toolExecutionIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'ToolExecution',
      },
    ],
    error: {
      type: Schema.Types.Mixed,
      default: undefined,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    startedAt: Date,
    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

TaskSchema.index({ userId: 1, status: 1 });
TaskSchema.index({ userId: 1, createdAt: -1 });

export const Task: Model<ITask> =
  mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type ToolExecutionStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';

export interface IToolExecution extends Document {
  userId: Types.ObjectId;
  taskId?: Types.ObjectId;
  conversationId?: Types.ObjectId;
  toolName: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  status: ToolExecutionStatus;
  durationMs: number;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ToolExecutionSchema = new Schema<IToolExecution>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    taskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      index: true,
    },
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      index: true,
    },
    toolName: {
      type: String,
      required: true,
      index: true,
    },
    input: {
      type: Schema.Types.Mixed,
      required: true,
      default: {},
    },
    output: {
      type: Schema.Types.Mixed,
      default: undefined,
    },
    status: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    durationMs: {
      type: Number,
      default: 0,
    },
    error: {
      type: String,
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

ToolExecutionSchema.index({ userId: 1, createdAt: -1 });

export const ToolExecution: Model<IToolExecution> =
  mongoose.models.ToolExecution ||
  mongoose.model<IToolExecution>('ToolExecution', ToolExecutionSchema);

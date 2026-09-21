import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type MemoryType =
  | 'WORKING_MEMORY'
  | 'CONVERSATION_MEMORY'
  | 'EPISODIC_MEMORY'
  | 'PERSONAL_MEMORY'
  | 'PROJECT_MEMORY';

export interface IMemory extends Document {
  userId: Types.ObjectId;
  content: string;
  memoryType: MemoryType;
  importance: number;
  tags: string[];
  source: 'user' | 'agent' | 'system';
  sourceId?: string;
  vectorId?: string; // Corresponds to the UUID stored in Qdrant
  createdAt: Date;
  updatedAt: Date;
}

const MemorySchema = new Schema<IMemory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    memoryType: {
      type: String,
      enum: [
        'WORKING_MEMORY',
        'CONVERSATION_MEMORY',
        'EPISODIC_MEMORY',
        'PERSONAL_MEMORY',
        'PROJECT_MEMORY',
      ],
      required: true,
      index: true,
    },
    importance: {
      type: Number,
      min: 1,
      max: 10,
      default: 5,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    source: {
      type: String,
      enum: ['user', 'agent', 'system'],
      default: 'user',
    },
    sourceId: {
      type: String,
      default: '',
    },
    vectorId: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

MemorySchema.index({ userId: 1, memoryType: 1 });
MemorySchema.index({ userId: 1, createdAt: -1 });

export const Memory: Model<IMemory> =
  mongoose.models.Memory || mongoose.model<IMemory>('Memory', MemorySchema);

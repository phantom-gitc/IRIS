import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type ConversationStatus = 'active' | 'archived' | 'deleted';

export interface IConversation extends Document {
  userId: Types.ObjectId;
  title: string;
  summary?: string;
  status: ConversationStatus;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      default: 'New Conversation',
    },
    summary: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'archived', 'deleted'],
      default: 'active',
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user conversations ordered by recency
ConversationSchema.index({ userId: 1, updatedAt: -1 });

export const Conversation: Model<IConversation> =
  mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema);

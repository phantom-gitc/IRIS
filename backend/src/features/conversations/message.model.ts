import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

export interface IToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface IToolResult {
  toolCallId: string;
  name: string;
  result: unknown;
  success: boolean;
  error?: string;
}

export interface IMessage extends Document {
  conversationId: Types.ObjectId;
  userId: Types.ObjectId;
  role: MessageRole;
  content: string;
  toolCalls?: IToolCall[];
  toolResults?: IToolResult[];
  tokens?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant', 'system', 'tool'],
      required: true,
    },
    content: {
      type: String,
      default: '',
    },
    toolCalls: {
      type: [Schema.Types.Mixed],
      default: undefined,
    },
    toolResults: {
      type: [Schema.Types.Mixed],
      default: undefined,
    },
    tokens: {
      promptTokens: { type: Number, default: 0 },
      completionTokens: { type: Number, default: 0 },
      totalTokens: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for chronological message retrieval within a conversation
MessageSchema.index({ conversationId: 1, createdAt: 1 });
MessageSchema.index({ userId: 1, createdAt: -1 });

export const Message: Model<IMessage> =
  mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

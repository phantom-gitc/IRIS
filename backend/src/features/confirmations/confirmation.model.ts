import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type ConfirmationRiskLevel = 'SAFE' | 'CONFIRM' | 'HIGH_RISK';
export type ConfirmationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

export interface IConfirmation extends Document {
  userId: Types.ObjectId;
  taskId?: Types.ObjectId;
  toolName: string;
  inputPayload: Record<string, unknown>;
  riskLevel: ConfirmationRiskLevel;
  status: ConfirmationStatus;
  token: string;
  expiresAt: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ConfirmationSchema = new Schema<IConfirmation>(
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
    toolName: {
      type: String,
      required: true,
    },
    inputPayload: {
      type: Schema.Types.Mixed,
      required: true,
      default: {},
    },
    riskLevel: {
      type: String,
      enum: ['SAFE', 'CONFIRM', 'HIGH_RISK'],
      required: true,
      default: 'CONFIRM',
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'],
      default: 'PENDING',
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Automatically delete when expired
    },
    approvedAt: Date,
    rejectedAt: Date,
  },
  {
    timestamps: true,
  }
);

ConfirmationSchema.index({ userId: 1, status: 1 });

export const Confirmation: Model<IConfirmation> =
  mongoose.models.Confirmation ||
  mongoose.model<IConfirmation>('Confirmation', ConfirmationSchema);

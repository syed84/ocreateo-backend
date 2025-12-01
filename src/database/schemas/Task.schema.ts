import mongoose, { Schema, Document } from 'mongoose';

export interface ITaskDocument extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITaskDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    completed: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        ret.taskId = ret._id.toString();
        ret.userId = ret.userId.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound index for efficient queries
TaskSchema.index({ userId: 1, completed: 1 });
TaskSchema.index({ createdAt: -1 });

export const TaskModel = mongoose.model<ITaskDocument>('Task', TaskSchema);
import { TaskModel, ITaskDocument } from '../../models/task.model';
import { Task, CreateTaskDTO, UpdateTaskDTO } from '../../types/Task';
import mongoose from 'mongoose';

export class TaskRepository {
  async create(userId: string, taskData: CreateTaskDTO): Promise<Task> {
    const task = await TaskModel.create({
      userId: new mongoose.Types.ObjectId(userId),
      title: taskData.title,
      description: taskData.description,
      completed: false,
    });

    return this.toTaskModel(task);
  }

  async findById(taskId: string): Promise<Task | null> {
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return null;
    }

    const task = await TaskModel.findById(taskId);
    return task ? this.toTaskModel(task) : null;
  }

  async findByUserId(userId: string): Promise<Task[]> {
    const tasks = await TaskModel.find({ 
      userId: new mongoose.Types.ObjectId(userId) 
    }).sort({ createdAt: -1 });
    
    return tasks.map(task => this.toTaskModel(task));
  }

  async findAll(): Promise<Task[]> {
    const tasks = await TaskModel.find().sort({ createdAt: -1 });
    return tasks.map(task => this.toTaskModel(task));
  }

  async findIncompleteTasks(thresholdDate: Date): Promise<Task[]> {
    const tasks = await TaskModel.find({
      completed: false,
      createdAt: { $lt: thresholdDate },
    }).sort({ createdAt: 1 });

    return tasks.map(task => this.toTaskModel(task));
  }

  async update(taskId: string, updates: UpdateTaskDTO): Promise<Task | null> {
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return null;
    }

    const task = await TaskModel.findByIdAndUpdate(
      taskId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    return task ? this.toTaskModel(task) : null;
  }

  async delete(taskId: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return false;
    }

    const result = await TaskModel.findByIdAndDelete(taskId);
    return result !== null;
  }

  async countByUserId(userId: string): Promise<number> {
    return await TaskModel.countDocuments({ 
      userId: new mongoose.Types.ObjectId(userId) 
    });
  }

  async countCompleted(userId: string): Promise<number> {
    return await TaskModel.countDocuments({ 
      userId: new mongoose.Types.ObjectId(userId),
      completed: true 
    });
  }

  private toTaskModel(taskDoc: ITaskDocument | any): Task {
    return {
      taskId: taskDoc._id.toString(),
      userId: taskDoc.userId.toString(),
      title: taskDoc.title,
      description: taskDoc.description,
      completed: taskDoc.completed,
      createdAt: taskDoc.createdAt,
      updatedAt: taskDoc.updatedAt,
    };
  }
}

export const taskRepository = new TaskRepository();
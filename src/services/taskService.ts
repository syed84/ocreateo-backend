import { taskRepository } from '../database/repositories/taskRepository';
import { Task, CreateTaskDTO, UpdateTaskDTO } from '../types/Task';
import { emitTaskEvent } from '../utils/socketEvents';

class TaskService {
  async getUserTasks(userId: string): Promise<Task[]> {
    return await taskRepository.findByUserId(userId);
  }

  async createTask(userId: string, taskData: CreateTaskDTO): Promise<Task> {
    const task = await taskRepository.create(userId, taskData);
    
    // Emit WebSocket event
    emitTaskEvent('newTask', {
      message: 'New task created',
      task,
    });

    return task;
  }

  async updateTask(userId: string, taskId: string, updates: UpdateTaskDTO): Promise<Task | null> {
    // First, verify the task exists and belongs to the user
    const existingTask = await taskRepository.findById(taskId);
    
    if (!existingTask) {
      return null;
    }

    if (existingTask.userId !== userId) {
      return null;
    }

    // Update the task
    const updatedTask = await taskRepository.update(taskId, updates);

    if (updatedTask) {
      // Emit WebSocket event
      emitTaskEvent('taskUpdated', {
        message: 'Task updated',
        task: updatedTask,
        changes: updates,
      });

      // If task was marked as completed, emit specific event
      if (updates.completed === true && existingTask.completed === false) {
        emitTaskEvent('taskCompleted', {
          message: 'Task marked as completed',
          task: updatedTask,
        });
      }
    }

    return updatedTask;
  }

  async deleteTask(userId: string, taskId: string): Promise<boolean> {
    // First, verify the task exists and belongs to the user
    const existingTask = await taskRepository.findById(taskId);
    
    if (!existingTask) {
      return false;
    }

    if (existingTask.userId !== userId) {
      return false;
    }

    const deleted = await taskRepository.delete(taskId);

    if (deleted) {
      // Emit WebSocket event
      emitTaskEvent('taskDeleted', {
        message: 'Task deleted',
        data: {
          taskId,
          userId,
          deletedAt: new Date(),
        },
      });
    }

    return deleted;
  }

  async getIncompleteTasks(thresholdHours: number): Promise<Task[]> {
    const thresholdDate = new Date();
    thresholdDate.setHours(thresholdDate.getHours() - thresholdHours);
    
    return await taskRepository.findIncompleteTasks(thresholdDate);
  }
}

export const taskService = new TaskService();
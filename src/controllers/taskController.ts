import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { taskService } from '../services/taskService';
import { sendSuccess, sendError } from '../utils/responses';

class TaskController {
  async getTasks(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const tasks = await taskService.getUserTasks(userId);
      sendSuccess(res, { tasks });
    } catch (error) {
      next(error);
    }
  }

  async createTask(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { title, description } = req.body;

      const task = await taskService.createTask(userId, { title, description });
      sendSuccess(res, { task }, 'Task created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateTask(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { taskId } = req.params;
      const updates = req.body;

      const task = await taskService.updateTask(userId, taskId, updates);
      
      if (!task) {
        sendError(res, 'Task not found or unauthorized', 404);
        return;
      }

      sendSuccess(res, { task }, 'Task updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteTask(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { taskId } = req.params;

      const deleted = await taskService.deleteTask(userId, taskId);
      
      if (!deleted) {
        sendError(res, 'Task not found or unauthorized', 404);
        return;
      }

      sendSuccess(res, null, 'Task deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default new TaskController();
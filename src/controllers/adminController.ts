import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { taskRepository } from '../database/repositories/taskRepository';
import { sendSuccess } from '../utils/responses';

class AdminController {
  async getAllTasks(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tasks = await taskRepository.findAll();
      sendSuccess(res, { tasks, total: tasks.length });
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminController();
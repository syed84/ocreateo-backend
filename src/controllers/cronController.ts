import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { cronService } from '../services/cronService';
import { sendSuccess } from '../utils/responses';

class CronController {
  async triggerReminders(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await cronService.triggerTaskReminders();
      sendSuccess(res, { timestamp: new Date() }, 'Task reminders triggered successfully');
    } catch (error) {
      next(error);
    }
  }

  async getCronStatus(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const jobs = cronService.getJobsStatus();
      sendSuccess(res, {
        cronEnabled: true,
        jobs,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new CronController();
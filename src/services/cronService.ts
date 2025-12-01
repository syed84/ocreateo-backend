import cron from 'node-cron';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import { taskRepository } from '../database/repositories/taskRepository';
import { userRepository } from '../database/repositories/userRepository';
import { Task } from '../models/Task';
import { emitToAdmins } from '../utils/socketEvents';

export class CronService {
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  /**
   * Initialize all cron jobs
   */
  initializeCronJobs(): void {
    if (!config.cron.enabled) {
      logger.warn('Cron jobs are disabled in configuration');
      return;
    }

    this.setupTaskReminderJob();
    logger.info('All cron jobs initialized successfully');
  }

  /**
   * Setup the task reminder cron job
   * Runs daily at configured time (default: 8:00 AM)
   */
  private setupTaskReminderJob(): void {
    const schedule = config.cron.reminderSchedule;

    // Validate cron expression
    if (!cron.validate(schedule)) {
      logger.error(`Invalid cron schedule: ${schedule}`);
      return;
    }

    const job = cron.schedule(schedule, async () => {
      logger.info('Running task reminder cron job...');
      await this.sendTaskReminders();
    });

    this.jobs.set('taskReminder', job);
    logger.info(`Task reminder cron job scheduled: ${schedule}`);
  }

  /**
   * Find and send reminders for incomplete tasks older than threshold
   */
  private async sendTaskReminders(): Promise<void> {
    try {
      // Calculate threshold date
      const thresholdMs = config.cron.taskReminderThresholdHours * 60 * 60 * 1000;
      const thresholdDate = new Date(Date.now() - thresholdMs);

      // Use repository method to find incomplete tasks
      const incompleteTasks = await taskRepository.findIncompleteTasks(thresholdDate);

      if (incompleteTasks.length === 0) {
        logger.info('No incomplete tasks found that need reminders');
        return;
      }

      logger.info(`Found ${incompleteTasks.length} incomplete tasks for reminders`);

      // Log reminders
      await this.logTaskReminders(incompleteTasks);

      // Send WebSocket notifications to admins
      this.notifyAdmins(incompleteTasks);

      logger.info(`Task reminders sent successfully for ${incompleteTasks.length} tasks`);
    } catch (error) {
      logger.error('Error sending task reminders:', error);
    }
  }

  /**
   * Log task reminders to console
   */
  private async logTaskReminders(tasks: Task[]): Promise<void> {
    logger.info('=== TASK REMINDERS ===');
    logger.info(`Total incomplete tasks older than ${config.cron.taskReminderThresholdHours} hours: ${tasks.length}`);
    logger.info('=====================');

    for (const task of tasks) {
      const user = await userRepository.findById(task.userId);
      const taskAge = this.calculateTaskAge(task.createdAt);

      logger.info(`
Task ID: ${task.taskId}
User: ${user?.email || 'Unknown'}
Title: ${task.title}
Description: ${task.description}
Created At: ${new Date(task.createdAt).toISOString()}
Age: ${taskAge}
Status: Incomplete
-------------------
      `.trim());
    }

    logger.info('=== END REMINDERS ===\n');
  }

  /**
   * Send WebSocket notification to admins
   */
  private notifyAdmins(tasks: Task[]): void {
    try {
      const reminderData = tasks.map(task => ({
        taskId: task.taskId,
        userId: task.userId,
        title: task.title,
        description: task.description,
        createdAt: task.createdAt,
        age: this.calculateTaskAge(task.createdAt),
      }));

      emitToAdmins('taskReminders', {
        message: `${tasks.length} incomplete tasks need attention`,
        count: tasks.length,
        tasks: reminderData,
        timestamp: new Date(),
      });

      logger.info('WebSocket notification sent to admins');
    } catch (error) {
      logger.error('Failed to send WebSocket notification:', error);
    }
  }

  /**
   * Calculate human-readable task age
   */
  private calculateTaskAge(createdAt: Date): string {
    const now = new Date();
    const ageMs = now.getTime() - new Date(createdAt).getTime();
    const hours = Math.floor(ageMs / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day(s) ${hours % 24} hour(s)`;
    }
    return `${hours} hour(s)`;
  }

  /**
   * Manually trigger task reminders (for testing)
   */
  async triggerTaskReminders(): Promise<void> {
    logger.info('Manually triggering task reminders...');
    await this.sendTaskReminders();
  }

  /**
   * Stop all cron jobs
   */
  stopAllJobs(): void {
    this.jobs.forEach((job, name) => {
      job.stop();
      logger.info(`Stopped cron job: ${name}`);
    });
    this.jobs.clear();
  }

  /**
   * Get status of all cron jobs
   */
  getJobsStatus(): Array<{ name: string; schedule: string; running: boolean }> {
    const status: Array<{ name: string; schedule: string; running: boolean }> = [];

    if (this.jobs.has('taskReminder')) {
      status.push({
        name: 'Task Reminder',
        schedule: config.cron.reminderSchedule,
        running: true,
      });
    }

    return status;
  }
}

export const cronService = new CronService();
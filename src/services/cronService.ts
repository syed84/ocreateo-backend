import cron from 'node-cron';
import { taskRepository } from '../database/repositories/taskRepository';
import { userRepository } from '../database/repositories/userRepository';
import { logger } from '../utils/logger';
import { emitToAdmins, emitTaskReminderToUser } from '../utils/socketEvents';
import { config } from '../config/config';

class CronService {
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private isEnabled: boolean = false;

  /**
   * Initialize all cron jobs
   */
  initializeCronJobs(): void {
    if (!config.cron.enabled) {
      logger.info('Cron jobs are disabled in configuration');
      return;
    }

    this.isEnabled = true;
    this.scheduleTaskReminders();
    logger.info('Cron service initialized successfully');
  }

  /**
   * Setup the task reminder cron job
   * Runs daily at configured time (default: 8:00 AM)
   */
  private scheduleTaskReminders(): void {
    const schedule = config.cron.reminderSchedule;
    
    logger.info(`Scheduling task reminder cron job: ${schedule}`);

    const job = cron.schedule(schedule, async () => {
      await this.triggerTaskReminders();
    });

    this.jobs.set('taskReminder', job);
    logger.info(`Task reminder cron job scheduled: ${schedule}`);
  }

  /**
   * Find and send reminders for incomplete tasks older than threshold
   */
  async triggerTaskReminders(): Promise<void> {
    try {
      logger.info('Running task reminder cron job...');

      const thresholdHours = config.cron.taskReminderThresholdHours;
      const thresholdDate = new Date();
      thresholdDate.setHours(thresholdDate.getHours() - thresholdHours);

      // Get all incomplete tasks older than threshold
      const incompleteTasks = await taskRepository.findIncompleteTasks(thresholdDate);

      if (incompleteTasks.length === 0) {
        logger.info('No incomplete tasks found that need reminders');
        return;
      }

      logger.info(`Found ${incompleteTasks.length} incomplete tasks for reminders`);

      // Log to console
      this.logTaskReminders(incompleteTasks, thresholdHours);

      // Group tasks by user
      const tasksByUser = this.groupTasksByUser(incompleteTasks);

      // Send reminders to individual users
      await this.sendUserReminders(tasksByUser, thresholdHours);

      // Send summary to admins
      await this.sendAdminSummary(incompleteTasks, thresholdHours, tasksByUser);

      logger.info(`Task reminders sent successfully for ${incompleteTasks.length} tasks to ${tasksByUser.size} users and all admins`);
    } catch (error) {
      logger.error('Error in task reminder cron job:', error);
      throw error;
    }
  }

  private groupTasksByUser(tasks: any[]): Map<string, any[]> {
    const tasksByUser = new Map<string, any[]>();
    
    tasks.forEach(task => {
      const userId = task.userId.toString();
      if (!tasksByUser.has(userId)) {
        tasksByUser.set(userId, []);
      }
      tasksByUser.get(userId)!.push(task);
    });
    
    return tasksByUser;
  }

  private async sendUserReminders(tasksByUser: Map<string, any[]>, thresholdHours: number): Promise<void> {
    logger.info(`Sending individual reminders to ${tasksByUser.size} users...`);

    for (const [userId, userTasks] of tasksByUser) {
      try {
        // Get user details
        const user = await userRepository.findById(userId);
        const userEmail = user ? user.email : 'Unknown User';

        // Prepare task details
        const taskDetails = userTasks.map(task => ({
          taskId: task.taskId,
          title: task.title,
          description: task.description,
          createdAt: task.createdAt.toISOString(),
          age: this.calculateTaskAge(task.createdAt),
          daysOld: this.getDaysOld(task.createdAt),
        }));

        // Send WebSocket notification to the user
        emitTaskReminderToUser(userId, taskDetails);

        logger.info(`✉️ Reminder sent to ${userEmail}: ${userTasks.length} task(s)`);
      } catch (error) {
        logger.error(`Failed to send reminder to user ${userId}:`, error);
      }
    }
  }

  private async sendAdminSummary(tasks: any[], thresholdHours: number, tasksByUser: Map<string, any[]>): Promise<void> {
    try {
      // Prepare detailed task list with user info
      const taskDetails = await Promise.all(
        tasks.map(async (task) => {
          let userEmail = 'Unknown';
          try {
            const user = await userRepository.findById(task.userId);
            if (user) {
              userEmail = user.email;
            }
          } catch (error) {
            logger.warn(`Could not fetch user email for userId: ${task.userId}`);
          }

          return {
            taskId: task.taskId,
            userId: task.userId,
            userEmail,
            title: task.title,
            description: task.description,
            createdAt: task.createdAt.toISOString(),
            age: this.calculateTaskAge(task.createdAt),
            daysOld: this.getDaysOld(task.createdAt),
          };
        })
      );

      // Prepare summary by user
      const userSummaries = Array.from(tasksByUser.entries()).map(([userId, userTasks]) => {
        const user = taskDetails.find(t => t.userId.toString() === userId);
        return {
          userId,
          userEmail: user?.userEmail || 'Unknown',
          taskCount: userTasks.length,
          tasks: userTasks.map(t => ({
            taskId: t.taskId,
            title: t.title,
            age: this.calculateTaskAge(t.createdAt),
          })),
        };
      });

      const adminReminderData = {
        message: `${tasks.length} incomplete task${tasks.length > 1 ? 's' : ''} from ${tasksByUser.size} user${tasksByUser.size > 1 ? 's' : ''} need attention`,
        summary: {
          totalTasks: tasks.length,
          totalUsers: tasksByUser.size,
          thresholdHours,
        },
        userSummaries,
        allTasks: taskDetails,
        timestamp: new Date().toISOString(),
      };

      // Emit to all connected admin clients
      emitToAdmins('adminTaskReminders', adminReminderData);
      logger.info('📊 Admin summary sent to all admins');
    } catch (error) {
      logger.error('Error sending admin summary:', error);
    }
  }

  /**
   * Log task reminders to console
   */
  private logTaskReminders(tasks: any[], thresholdHours: number): void {
    logger.info('='.repeat(70));
    logger.info('=== TASK REMINDERS ===');
    logger.info(`Total incomplete tasks older than ${thresholdHours} hours: ${tasks.length}`);
    logger.info('='.repeat(70));
    logger.info('');

    // Group by user for logging
    const tasksByUser = this.groupTasksByUser(tasks);
    
    logger.info(`📧 Reminders will be sent to ${tasksByUser.size} user(s):`);
    logger.info('');

    tasksByUser.forEach((userTasks, userId) => {
      logger.info(`👤 User ID: ${userId}`);
      logger.info(`   Tasks: ${userTasks.length}`);
      logger.info('');

      userTasks.forEach((task, index) => {
        const age = this.calculateTaskAge(task.createdAt);
        
        logger.info(`   [${index + 1}/${userTasks.length}] ${task.title}`);
        logger.info(`       Task ID: ${task.taskId}`);
        logger.info(`       Description: ${task.description}`);
        logger.info(`       Created: ${task.createdAt.toISOString()}`);
        logger.info(`       Age: ${age}`);
        logger.info(`       Status: ${task.completed ? 'Completed' : 'Incomplete'}`);
        logger.info('');
      });
      
      logger.info('-'.repeat(70));
      logger.info('');
    });

    logger.info('=== END TASK REMINDERS ===');
    logger.info('='.repeat(70));
    logger.info('');
  }

  /**
   * Calculate human-readable task age
   */
  private calculateTaskAge(createdAt: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(createdAt).getTime();
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ${hours} hour${hours !== 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
  }

  private getDaysOld(createdAt: Date): number {
    const now = new Date();
    const diff = now.getTime() - new Date(createdAt).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Get status of all cron jobs
   */
  getJobsStatus(): any[] {
    const statuses: Array<{ name: string; schedule: string; running: boolean; nextExecution: string }> = [];
    
    this.jobs.forEach((job, name) => {
      statuses.push({
        name: name === 'taskReminder' ? 'Task Reminder' : name,
        schedule: config.cron.reminderSchedule,
        running: this.isEnabled,
        nextExecution: 'Daily at 8:00 AM',
      });
    });

    return statuses;
  }

  /**
   * Stop all cron jobs
   */
  stopAllJobs(): void {
    this.jobs.forEach((job) => {
      job.stop();
    });
    logger.info('All cron jobs stopped');
  }
}

export const cronService = new CronService();
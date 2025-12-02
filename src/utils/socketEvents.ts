import { getIO } from '../config/socket';
import { logger } from './logger';

export const emitTaskEvent = (event: string, data: any): void => {
  try {
    const io = getIO();
    
    // Emit to all connected clients
    io.emit(event, data);
    
    logger.info(`WebSocket event emitted: ${event}`);
  } catch (error) {
    logger.error(`Failed to emit WebSocket event: ${event}`, error);
  }
};

export const emitToUser = (userId: string, event: string, data: any): void => {
  try {
    const io = getIO();
    
    // Emit to specific user's room
    io.to(`user:${userId}`).emit(event, data);
    
    logger.info(`WebSocket event emitted to user ${userId}: ${event}`);
  } catch (error) {
    logger.error(`Failed to emit WebSocket event to user: ${event}`, error);
  }
};

export const emitToAdmins = (event: string, data: any): void => {
  try {
    const io = getIO();
    
    // Emit to admins room
    io.to('admins').emit(event, data);
    
    logger.info(`WebSocket event emitted to admins: ${event}`);
  } catch (error) {
    logger.error(`Failed to emit WebSocket event to admins: ${event}`, error);
  }
};

export const emitToRoom = (room: string, event: string, data: any): void => {
  try {
    const io = getIO();
    
    // Emit to specific room
    io.to(room).emit(event, data);
    
    logger.info(`WebSocket event emitted to room ${room}: ${event}`);
  } catch (error) {
    logger.error(`Failed to emit WebSocket event to room: ${event}`, error);
  }
};

export const emitTaskReminderToUser = (userId: string, tasks: any[]): void => {
  try {
    const io = getIO();
    
    const reminderData = {
      message: `You have ${tasks.length} incomplete task${tasks.length > 1 ? 's' : ''} that need${tasks.length === 1 ? 's' : ''} attention`,
      count: tasks.length,
      tasks: tasks.map(task => ({
        taskId: task.taskId,
        title: task.title,
        description: task.description,
        createdAt: task.createdAt,
        age: task.age,
        daysOld: task.daysOld,
      })),
      timestamp: new Date().toISOString(),
    };
    
    // Emit to specific user's room
    io.to(`user:${userId}`).emit('userTaskReminders', reminderData);
    
    logger.info(`Task reminders sent to user ${userId}: ${tasks.length} task(s)`);
  } catch (error) {
    logger.error(`Failed to emit task reminders to user ${userId}:`, error);
  }
};
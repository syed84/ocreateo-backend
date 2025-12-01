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
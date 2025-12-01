import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from './config';
import { UserRole } from '../models/User';
import { logger } from '../utils/logger';

export interface AuthSocket extends Socket {
  user?: {
    userId: string;
    email: string;
    role: UserRole;
  };
}

let io: Server;

export const initializeSocket = (server: HTTPServer): Server => {
  io = new Server(server, {
    cors: {
      origin: config.cors.origin,
      credentials: true,
    },
  });

  // Authentication middleware for Socket.IO
  io.use((socket: AuthSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }

      const decoded = jwt.verify(token, config.jwt.secret) as {
        userId: string;
        email: string;
        role: UserRole;
      };

      socket.user = decoded;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: AuthSocket) => {
    logger.info(`Client connected: ${socket.id} - User: ${socket.user?.email}`);

    // Join admin room if user is admin
    if (socket.user?.role === UserRole.ADMIN) {
      socket.join('admins');
      logger.info(`Admin ${socket.user.email} joined admin room`);
    }

    // Join user-specific room
    socket.join(`user:${socket.user?.userId}`);

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};
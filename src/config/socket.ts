import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from './config';
import { logger } from '../utils/logger';

let io: Server;

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

interface AuthSocket extends Socket {
  user?: JWTPayload;
}

export const initializeSocket = (server: HttpServer): Server => {
  io = new Server(server, {
    cors: {
      origin: config.cors.origin.split(','),
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware
  io.use((socket: AuthSocket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        logger.warn('WebSocket connection attempt without token');
        return next(new Error('Authentication token required'));
      }

      // Verify token
      const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
      socket.user = decoded;
      
      logger.info(`WebSocket authenticated: ${decoded.email} (${decoded.role})`);
      next();
    } catch (error) {
      logger.error('WebSocket authentication failed:', error);
      next(new Error('Invalid authentication token'));
    }
  });

  io.on('connection', (socket: AuthSocket) => {
    const user = socket.user!;
    
    logger.info(`WebSocket client connected: ${socket.id} - User: ${user.email} (${user.role})`);

    // Join user-specific room
    socket.join(`user:${user.userId}`);
    
    // Join admin room if user is admin
    if (user.role === 'admin') {
      socket.join('admins');
      logger.info(`Admin ${user.email} joined admins room`);
    }

    // Send welcome message
    socket.emit('connected', {
      message: 'Successfully connected to WebSocket server',
      userId: user.userId,
      email: user.email,
      role: user.role,
      socketId: socket.id,
      rooms: Array.from(socket.rooms),
      timestamp: new Date().toISOString(),
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`WebSocket client disconnected: ${socket.id} - User: ${user.email} - Reason: ${reason}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`WebSocket error for ${socket.id}:`, error);
    });

    // Optional: Handle custom events
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });
  });

  logger.info('Socket.IO server initialized with authentication');
  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeSocket first.');
  }
  return io;
};
import express, { Application, Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/config';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { initializeSocket } from './config/socket';
import { cronService } from './services/cronService';
import { connectDatabase } from './database/connection';
import authRoutes from './routes/auth.routes';
import taskRoutes from './routes/task.routes';
import adminRoutes from './routes/admin.routes';
import websocketRoutes from './routes/websocket.routes';
import cronRoutes from './routes/cron.routes';

const app: Application = express();
const server = createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);

app.use(helmet());
app.use(cors({
  origin: config.cors.origin.split(','),
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    websocket: 'active',
    database: 'connected',
    cronJobs: cronService.getJobsStatus(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/websocket', websocketRoutes);
app.use('/api/cron', cronRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = config.port;

// Start server after database connection
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Initialize Cron Jobs
    cronService.initializeCronJobs();

    server.listen(PORT, () => {
      logger.info(`Server running in ${config.env} mode on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`WebSocket server initialized`);
      logger.info(`Cron jobs status: ${config.cron.enabled ? 'Enabled' : 'Disabled'}`);
      if (config.cron.enabled) {
        logger.info(`Task reminders scheduled: ${config.cron.reminderSchedule}`);
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  cronService.stopAllJobs();
  server.close(() => {
    logger.info('HTTP server closed');
  });
});

startServer();

export { app, io };
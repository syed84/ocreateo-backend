import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  jwt: {
    secret: process.env.JWT_SECRET || 'your_secret_key_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ocreateo_db',
  },
  cron: {
    enabled: process.env.CRON_ENABLED === 'true',
    reminderSchedule: process.env.CRON_REMINDER_SCHEDULE || '0 8 * * *', // 8:00 AM daily
    taskReminderThresholdHours: parseInt(process.env.TASK_REMINDER_THRESHOLD_HOURS || '24', 10),
  },
};
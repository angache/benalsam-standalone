import winston from 'winston';
import path from 'path';

// Create logs directory if it doesn't exist
import fs from 'fs';
const logsDir = process.env.NODE_ENV === 'production' 
  ? '/app/logs' 
  : path.join(__dirname, '../../logs');

// Create directory if it doesn't exist (Docker handles permissions)
let canWriteLogs = false;
if (!fs.existsSync(logsDir)) {
  try {
    fs.mkdirSync(logsDir, { recursive: true });
    canWriteLogs = true;
  } catch (error) {
    // If we can't create logs directory, use console only
    console.warn('Could not create logs directory, using console only');
    canWriteLogs = false;
  }
} else {
  canWriteLogs = true;
}

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'admin-backend' },
  transports: [
    // Only add file transports if we can write logs
    ...(canWriteLogs ? [
      // Write all logs with importance level of `error` or less to `error.log`
      new winston.transports.File({ 
        filename: path.join(logsDir, 'error.log'), 
        level: 'error' 
      }),
      // Write all logs with importance level of `info` or less to `combined.log`
      new winston.transports.File({ 
        filename: path.join(logsDir, 'combined.log') 
      }),
    ] : []),
  ],
});

// Always log to console in production, and in development
logger.add(new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  )
}));

// Create a stream object for Morgan
export const logStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export default logger; 
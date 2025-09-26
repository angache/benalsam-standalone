import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Create logs directory if it doesn't exist
const logsDir = process.env.NODE_ENV === 'production' 
  ? '/app/logs' 
  : path.join(__dirname, '../../logs');

// Create directory if it doesn't exist
let canWriteLogs = false;
if (!fs.existsSync(logsDir)) {
  try {
    fs.mkdirSync(logsDir, { recursive: true });
    canWriteLogs = true;
  } catch (error) {
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
  defaultMeta: { 
    service: 'categories-service',
    version: process.env.SERVICE_VERSION || '1.0.0'
  },
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

// Always log to console in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
        return `${timestamp} [${service}] ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
      })
    )
  }));
}

// Add console transport for production (structured logging)
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }));
}

export { logger };
export default logger;

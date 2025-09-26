import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    // Filter out circular references
    const cleanMeta = JSON.parse(JSON.stringify(meta, (key, value) => {
      if (key === 'req' || key === 'res' || key === 'socket' || key === '_httpMessage') {
        return '[Circular]';
      }
      return value;
    }));
    
    return JSON.stringify({
      timestamp,
      level,
      message,
      service: service || 'search-service',
      ...cleanMeta
    });
  })
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'search-service' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // File transport with rotation
    new DailyRotateFile({
      filename: `${process.env.LOG_FILE_PATH || './logs'}/search-service-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      maxSize: process.env.LOG_MAX_SIZE || '20m',
      maxFiles: process.env.LOG_MAX_FILES || '14d',
      format: logFormat
    }),
    
    // Error file transport
    new DailyRotateFile({
      filename: `${process.env.LOG_FILE_PATH || './logs'}/search-service-error-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: process.env.LOG_MAX_SIZE || '20m',
      maxFiles: process.env.LOG_MAX_FILES || '14d',
      format: logFormat
    })
  ]
});

export { logger };
export default logger;

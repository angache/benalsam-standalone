export class DebugLogger {
  private static logs: Array<{ timestamp: string; level: string; message: string; data?: any }> = [];
  private static maxLogs = 1000;

  static log(level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', message: string, data?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };

    this.logs.push(logEntry);

    // Max log sayısını aşarsa eski logları sil
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console'a da yazdır
    const emoji = {
      INFO: 'ℹ️',
      WARN: '⚠️',
      ERROR: '❌',
      DEBUG: '🔍'
    };

    console.log(`${emoji[level]} [${level}] ${message}`, data || '');
  }

  static info(message: string, data?: any) {
    this.log('INFO', message, data);
  }

  static warn(message: string, data?: any) {
    this.log('WARN', message, data);
  }

  static error(message: string, data?: any) {
    this.log('ERROR', message, data);
  }

  static debug(message: string, data?: any) {
    this.log('DEBUG', message, data);
  }

  static getLogs() {
    return [...this.logs];
  }

  static clearLogs() {
    this.logs = [];
  }

  static exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }

  static getRecentLogs(count: number = 50) {
    return this.logs.slice(-count);
  }
} 
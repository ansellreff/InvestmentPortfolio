/**
 * Production Logging System
 * Provides environment-aware logging with different levels
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDevelopment = process.env.NODE_ENV === 'development';

interface LoggerOptions {
  context?: string;
  timestamp?: boolean;
}

class Logger {
  private formatMessage(level: LogLevel, args: any[], options: LoggerOptions = {}): string {
    const { context, timestamp = true } = options;
    const timestampStr = timestamp ? `[${new Date().toISOString()}]` : '';
    const contextStr = context ? `[${context}]` : '';
    const parts = [timestampStr, `[${level.toUpperCase()}]`, contextStr].filter(Boolean);
    return parts.join(' ');
  }

  private log(level: LogLevel, args: any[], options?: LoggerOptions) {
    // In production, only log errors and warnings
    if (!isDevelopment && level !== 'error' && level !== 'warn') {
      return;
    }

    const message = this.formatMessage(level, args, options);
    const logMethod = level === 'debug' || level === 'info' ? console.log :
                       level === 'warn' ? console.warn :
                       console.error;

    logMethod(message, ...args);
  }

  debug(...args: any[]) {
    this.log('debug', args);
  }

  info(...args: any[]) {
    this.log('info', args);
  }

  warn(...args: any[]) {
    this.log('warn', args);
  }

  error(...args: any[]) {
    this.log('error', args);
  }

  /**
   * API-specific logging with context
   */
  api(endpoint: string, ...args: any[]) {
    this.log('debug', args, { context: `API:${endpoint}` });
  }

  /**
   * Component-specific logging
   */
  component(componentName: string, ...args: any[]) {
    this.log('debug', args, { context: componentName });
  }

  /**
   * Error logging with error object
   */
  logError(error: unknown, context?: string) {
    const errorObj = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error;

    this.log('error', [context || 'Error:', errorObj], { context });
  }
}

export const logger = new Logger();

/**
 * Create a context-specific logger
 */
export function createLogger(context: string) {
  return {
    debug: (...args: any[]) => logger.debug(...args),
    info: (...args: any[]) => logger.info(...args),
    warn: (...args: any[]) => logger.warn(...args),
    error: (...args: any[]) => logger.error(...args),
    logError: (error: unknown) => logger.logError(error, context),
  };
}

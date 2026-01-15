/**
 * Logging utility for consistent log prefixes across the codebase
 *
 * Provides structured logging methods with standardized prefixes to:
 * - Improve log readability and searchability
 * - Distinguish between different components (fragment-frame vs SDK)
 * - Maintain consistency in error messages
 *
 * @example
 * ```typescript
 * import { createLogger } from './helpers/logger';
 *
 * const logger = createLogger('fragment-frame');
 * logger.error('Failed to send message:', error);
 * logger.warn('Invalid message format:', message);
 * logger.log('Initialization complete');
 * ```
 */

export interface Logger {
  error: (...args: unknown[]) => void;
  log: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
}

/**
 * Create a logger instance with a specific prefix
 *
 * @param prefix - The component prefix (e.g., 'fragment-frame', 'frameSDK', 'serialization')
 * @returns Logger instance with error, warn, and log methods
 */
export function createLogger(prefix: string): Logger {
  const formattedPrefix = `[${prefix}]`;

  return {
    error: (...args: unknown[]) => {
      console.error(formattedPrefix, ...args);
    },
    log: (...args: unknown[]) => {
      console.log(formattedPrefix, ...args);
    },
    warn: (...args: unknown[]) => {
      console.warn(formattedPrefix, ...args);
    },
  };
}

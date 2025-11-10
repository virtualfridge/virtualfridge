import { sanitizeArgs, sanitizeInput } from './sanitizeInput';

const logger = {
  info: (message: string, ...args: unknown[]) => {
    const sanitizedMessage = sanitizeInput(message);
    console.log('[INFO]', sanitizedMessage, ...sanitizeArgs(args));
  },
  error: (message: string, ...args: unknown[]) => {
    const sanitizedMessage = sanitizeInput(message);
    console.error('[ERROR]', sanitizedMessage, ...sanitizeArgs(args));
  },
  warn: (message: string, ...args: unknown[]) => {
    const sanitizedMessage = sanitizeInput(message);
    console.warn('[WARN]', sanitizedMessage, ...sanitizeArgs(args));
  },
  debug: (message: string, ...args: unknown[]) => {
    const sanitizedMessage = sanitizeInput(message);
    console.debug('[DEBUG]', sanitizedMessage, ...sanitizeArgs(args));
  },
};

export default logger;

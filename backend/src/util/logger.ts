import { sanitizeArgs, sanitizeInput } from './sanitizeInput';

const logger = {
  info: (message: string, ...args: unknown[]) => {
    const sanitizedMessage = `[INFO] ${sanitizeInput(message)}`;
    console.log(sanitizedMessage, ...sanitizeArgs(args));
  },
  error: (message: string, ...args: unknown[]) => {
    const sanitizedMessage = `[ERROR] ${sanitizeInput(message)}`;
    console.error(sanitizedMessage, ...sanitizeArgs(args));
  },
  warn: (message: string, ...args: unknown[]) => {
    const sanitizedMessage = `[WARN] ${sanitizeInput(message)}`;
    console.warn(sanitizedMessage, ...sanitizeArgs(args));
  },
  debug: (message: string, ...args: unknown[]) => {
    const sanitizedMessage = `[DEBUG] ${sanitizeInput(message)}`;
    console.debug(sanitizedMessage, ...sanitizeArgs(args));
  },
};

export default logger;

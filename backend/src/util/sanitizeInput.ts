import { AxiosError } from 'axios';

export const sanitizeArgs = (args: unknown[]): unknown[] => {
  return args.map(arg => {
    // Handle error objects specially to preserve useful information
    // For some reason some AxiosErrors are not counted as instanceof Error so we check if the arg is an AxiosError too
    if (arg instanceof Error || arg instanceof AxiosError) {
      return {
        message: sanitizeInput(arg.message),
        name: arg.name,
        stack: arg.stack ? sanitizeInput(arg.stack) : undefined,
      };
    }
    // Handle objects
    if (typeof arg === 'object' && arg !== null) {
      // JSON.stringify can return undefined if, for example, there are circular references
      const encodedArg = JSON.stringify(arg) ?? String(arg);
      return sanitizeInput(encodedArg);
    }
    return sanitizeInput(String(arg));
  });
};

export const sanitizeInput = (input: string): string => {
  // Replace CRLF characters instead of throwing to prevent log injection
  // but still allow logging error messages that may contain newlines
  return input.replace(/[\r\n]/g, ' ');
};

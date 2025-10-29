export const sanitizeArgs = (args: unknown[]): unknown[] => {
  return args.map(arg => {
    // Handle error objects specially to preserve useful information
    if (arg instanceof Error) {
      return {
        message: sanitizeInput(arg.message),
        name: arg.name,
        stack: arg.stack ? sanitizeInput(arg.stack) : undefined
      };
    }
    // Handle objects
    if (typeof arg === 'object' && arg !== null) {
      return sanitizeInput(JSON.stringify(arg));
    }
    return sanitizeInput(String(arg));
  });
};

export const sanitizeInput = (input: string): string => {
  // Replace CRLF characters instead of throwing to prevent log injection
  // but still allow logging error messages that may contain newlines
  return input.replace(/[\r\n]/g, ' ');
};

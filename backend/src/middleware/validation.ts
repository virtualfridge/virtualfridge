import { Request, Response, NextFunction, RequestHandler } from 'express';
import { z, ZodError } from 'zod';
import logger from '../util/logger';

export const validateBody = <T>(
  schema: z.ZodSchema<T>
): RequestHandler<unknown, unknown, T, unknown> => {
  return (
    req: Request<unknown, unknown, T, unknown>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const validatedData = schema.parse(req.body);

      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Invalid input data',
          details: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
      }
      logger.error('Error validating data:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Validation processing failed',
      });
    }
  };
};

export const validateParams = <T>(
  schema: z.ZodSchema<T>
): RequestHandler<T> => {
  return (req: Request<T>, res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Invalid input data',
          details: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
      }

      logger.error('Error validating data:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Validation processing failed',
      });
    }
  };
};

export const validateQuery = <T>(
  schema: z.ZodSchema<T>
): RequestHandler<unknown, unknown, unknown, T> => {
  return (
    req: Request<unknown, unknown, unknown, T>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Invalid input data',
          details: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
      }

      logger.error('Error validating data:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Validation processing failed',
      });
    }
  };
};

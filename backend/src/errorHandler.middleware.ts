import { Request, Response } from 'express';

import logger from './logger.util';

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
  });
};

export const errorHandler = (error: Error, req: Request, res: Response) => {
  logger.error('Error:', error);

  return res.status(500).json({
    message: 'Internal server error',
  });
};

import express from 'express';
import router from '../../routes/routes';
import { errorHandler, notFoundHandler } from '../../middleware/errorHandler';

/**
 * Create an Express app for testing purposes
 */
export const createTestApp = () => {
  const app = express();

  app.use(express.json());
  app.use('/api', router);
  app.use('*', notFoundHandler);
  app.use(errorHandler);

  return app;
};

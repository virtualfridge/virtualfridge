import dotenv from 'dotenv';
import express from 'express';

import { connectDB } from './util/database';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import router from './routes/routes';
import path from 'path';
import logger from './util/logger';
import { cronService } from './services/cronService';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());

app.use('/api', router);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('*', notFoundHandler);
app.use(errorHandler);

connectDB().catch((error: unknown) => {
  logger.error('ConnectDB should exit on error; instead it threw: ', error);
});

app.listen(PORT, () => {
  console.log('🚀 Server running on port', PORT);

  // Start cron service for automated notifications
  cronService.start();
});

import { Router } from 'express';

import { authenticateToken } from '../middleware/auth';
import authRoutes from './auth';
import hobbiesRoutes from './hobbies';
import mediaRoutes from './media';
import usersRoutes from './user';

const router = Router();

router.use('/auth', authRoutes);

router.use('/hobbies', authenticateToken, hobbiesRoutes);

router.use('/user', authenticateToken, usersRoutes);

router.use('/media', authenticateToken, mediaRoutes);

export default router;

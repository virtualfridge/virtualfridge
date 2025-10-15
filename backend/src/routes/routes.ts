import { Router } from 'express';

import { authenticateToken } from '../middleware/auth';
import authRoutes from './auth';
import hobbiesRoutes from './hobbies';
import mediaRoutes from './media';
import usersRoutes from './user';
import foodItemRoutes from './foodItem';
import foodTypeRoutes from './foodType';

const router = Router();

router.use('/auth', authRoutes);

router.use('/hobbies', authenticateToken, hobbiesRoutes);

router.use('/user', authenticateToken, usersRoutes);

router.use('/media', authenticateToken, mediaRoutes);

router.use('/food-item', authenticateToken, foodItemRoutes);

router.use('/food-type', authenticateToken, foodTypeRoutes);

export default router;

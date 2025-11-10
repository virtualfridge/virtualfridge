import { Router } from 'express';

import { authenticateToken } from '../middleware/auth';
import authRoutes from './auth';
import testAuthRoutes from './test-auth';
import hobbiesRoutes from './hobbies';
import mediaRoutes from './media';
import usersRoutes from './user';
import foodItemRoutes from './foodItem';
import foodTypeRoutes from './foodType';
import recipeRoutes from './recipe';
import notificationRoutes from './notification';
import fridgeRoutes from './fridge';

const router = Router();

router.use('/auth', authRoutes);
router.use('/test-auth', testAuthRoutes); // Test-only endpoint for E2E tests

router.use('/hobbies', authenticateToken, hobbiesRoutes);

router.use('/user', authenticateToken, usersRoutes);

router.use('/media', authenticateToken, mediaRoutes);

router.use('/fridge', authenticateToken, fridgeRoutes);

router.use('/food-item', authenticateToken, foodItemRoutes);

router.use('/food-type', authenticateToken, foodTypeRoutes);

router.use('/recipes', authenticateToken, recipeRoutes);

router.use('/notifications', authenticateToken, notificationRoutes);

export default router;

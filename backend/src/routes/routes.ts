import { Router } from 'express';

import { authenticateToken } from '../middleware/auth';
import authRoutes from './auth';
import hobbiesRoutes from './hobbies';
import mediaRoutes from './media';
import usersRoutes from './user';
import foodItemRoutes from './foodItem';
import foodTypeRoutes from './foodType';
import barcodeRoutes from './barcode';
import recipeRoutes from './recipe';
import notificationRoutes from './notification';

const router = Router();

router.use('/auth', authRoutes);
router.use('/hobbies', authenticateToken, hobbiesRoutes);
router.use('/user', authenticateToken, usersRoutes);
router.use('/media', authenticateToken, mediaRoutes);
router.use('/barcode', authenticateToken, barcodeRoutes);

router.use('/food-item', authenticateToken, foodItemRoutes);

router.use('/food-type', authenticateToken, foodTypeRoutes);

router.use('/recipes', authenticateToken, recipeRoutes);

router.use('/notifications', authenticateToken, notificationRoutes);

export default router;

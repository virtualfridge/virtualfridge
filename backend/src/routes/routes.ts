import { Router } from 'express';

import { authenticateToken } from '../middleware/auth';
import authRoutes from './auth';
import hobbiesRoutes from './hobbies';
import mediaRoutes from './media';
import usersRoutes from './user';
import barcodeRoutes from './barcode';

const router = Router();

router.use('/auth', authRoutes);
router.use('/hobbies', authenticateToken, hobbiesRoutes);
router.use('/user', authenticateToken, usersRoutes);
router.use('/media', authenticateToken, mediaRoutes);
router.use('/barcode', authenticateToken, barcodeRoutes); 

export default router;

import { Router } from 'express';

import { UserController } from '../controllers/user';
import { UpdateProfileRequest, updateProfileSchema } from '../types/user';
import { validateBody } from '../middleware/validation';

const router = Router();
const userController = new UserController();

router.get('/profile', userController.getProfile);

router.post(
  '/profile',
  validateBody<UpdateProfileRequest>(updateProfileSchema),
  userController.updateProfile
);

router.delete('/profile', userController.deleteProfile);

export default router;

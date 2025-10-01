import { Router } from 'express';

import { UserController } from './user.controller';
import { UpdateProfileRequest, updateProfileSchema } from './user.types';
import { validateBody } from './validation.middleware';

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

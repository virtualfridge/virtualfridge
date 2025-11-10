import { Router } from 'express';

import { AuthController } from '../controllers/auth';
import { AuthenticateUserRequest, authenticateUserSchema } from '../types/auth';
import { validateBody } from '../middleware/validation';

const router = Router();
const authController = new AuthController();

router.post(
  '/google',
  authController.googleAuth.bind(authController)
);

router.post(
  '/signup',
  validateBody<AuthenticateUserRequest>(authenticateUserSchema),
  authController.signUp
);

router.post(
  '/signin',
  validateBody(authenticateUserSchema),
  authController.signIn
);

export default router;

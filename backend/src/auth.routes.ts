import { Router } from 'express';

import { AuthController } from './auth.controller';
import { AuthenticateUserRequest, authenticateUserSchema } from './auth.types';
import { validateBody } from './validation.middleware';

const router = Router();
const authController = new AuthController();

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

import { NextFunction, Request, Response } from 'express';

import { authService } from '../services/auth';
import {
  AuthenticateUserRequest,
  AuthenticateUserResponse,
} from '../types/auth';
import logger from '../util/logger';

export class AuthController {
  signUp = async (
    req: Request<unknown, unknown, AuthenticateUserRequest>,
    res: Response<AuthenticateUserResponse>,
    next: NextFunction
  ) => {
    try {
      const { idToken } = req.body;

      const data = await authService.signUpWithGoogle(idToken);

      return res.status(201).json({
        message: 'User signed up successfully',
        data,
      });
    } catch (error) {
      logger.error('Google sign up error:', error);

      if (error instanceof Error) {
        if (error.message === 'Invalid Google token') {
          return res.status(401).json({
            message: 'Invalid Google token',
          });
        }

        if (error.message === 'User already exists') {
          return res.status(409).json({
            message: 'User already exists, please sign in instead.',
          });
        }

        if (error.message === 'Failed to process user') {
          return res.status(500).json({
            message: 'Failed to process user information',
          });
        }
      }

      next(error);
    }
  };

  signIn = async (
    req: Request<unknown, unknown, AuthenticateUserRequest>,
    res: Response<AuthenticateUserResponse>,
    next: NextFunction
  ) => {
    try {
      const { idToken } = req.body;

      const data = await authService.signInWithGoogle(idToken);

      return res.status(200).json({
        message: 'User signed in successfully',
        data,
      });
    } catch (error) {
      logger.error('Google sign in error:', error);

      if (error instanceof Error) {
        if (error.message === 'Invalid Google token') {
          return res.status(401).json({
            message: 'Invalid Google token',
          });
        }

        if (error.message === 'User not found') {
          return res.status(404).json({
            message: 'User not found, please sign up first.',
          });
        }

        if (error.message === 'Failed to process user') {
          return res.status(500).json({
            message: 'Failed to process user information',
          });
        }
      }

      next(error);
    }
  }

  async googleAuth(
    req: Request<unknown, unknown, AuthenticateUserRequest>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        return res.status(400).json({
          error: 'idToken is required',
        });
      }

      const data = await authService.authenticateWithGoogle(idToken);

      return res.status(200).json({
        token: data.token,
        user: data.user,
      });
    } catch (error) {
      logger.error('Google authentication error:', error);

      if (error instanceof Error) {
        if (error.message === 'Invalid Google token') {
          return res.status(401).json({
            error: 'Invalid Google token',
          });
        }
      }

      next(error);
    }
  }
}

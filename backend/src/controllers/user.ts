import { NextFunction, Request, Response } from 'express';

import { GetProfileResponse, UpdateProfileRequest } from '../types/user';
import logger from '../util/logger';
import { MediaService } from '../services/media';
import { userModel } from '../models/user';

export class UserController {
  getProfile = (req: Request, res: Response<GetProfileResponse>) => {
    if (!req.user) {
      logger.error('User controller must always be used with auth middleware!');
      return res.status(500).json({
        message: 'Internal server error',
      });
    }
    const user = req.user;

    res.status(200).json({
      message: 'Profile fetched successfully',
      data: { user },
    });
  };

  updateProfile = async (
    req: Request<unknown, unknown, UpdateProfileRequest>,
    res: Response<GetProfileResponse>,
    next: NextFunction
  ) => {
    try {
      if (!req.user) {
        logger.error(
          'User controller must always be used with auth middleware!'
        );
        return res.status(500).json({
          message: 'Internal server error',
        });
      }
      const user = req.user;

      const updatedUser = await userModel.update(user._id, req.body);

      if (!updatedUser) {
        return res.status(404).json({
          message: 'User not found',
        });
      }

      res.status(200).json({
        message: 'User info updated successfully',
        data: { user: updatedUser },
      });
    } catch (error) {
      logger.error('Failed to update user info:', error);

      if (error instanceof Error) {
        return res.status(500).json({
          message: error.message || 'Failed to update user info',
        });
      }

      next(error);
    }
  };

  deleteProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        logger.error(
          'User controller must always be used with auth middleware!'
        );
        return res.status(500).json({
          message: 'Internal server error',
        });
      }
      const user = req.user;

      await MediaService.deleteAllUserImages(user._id.toString());

      await userModel.delete(user._id);

      res.status(200).json({
        message: 'User deleted successfully',
      });
    } catch (error) {
      logger.error('Failed to delete user:', error);

      if (error instanceof Error) {
        return res.status(500).json({
          message: error.message || 'Failed to delete user',
        });
      }

      next(error);
    }
  };
}

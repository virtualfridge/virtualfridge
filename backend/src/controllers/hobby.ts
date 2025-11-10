import { NextFunction, Request, Response } from 'express';

import { HOBBIES } from '../config/constants';
import logger from '../util/logger';
import { GetAllHobbiesResponse } from '../types/hobby';

export class HobbyController {
  getAllHobbies = (
    req: Request,
    res: Response<GetAllHobbiesResponse>,
    next: NextFunction
  ) => {
    try {
      res.status(200).json({
        message: 'All hobbies fetched successfully',
        data: { hobbies: HOBBIES },
      });
    } catch (error) {
      logger.error('Failed to fetch available hobbies:', error);

      if (error instanceof Error) {
        return res.status(500).json({
          message: error.message || 'Failed to fetch available hobbies',
        });
      }

      next(error);
    }
  };
}

import { NextFunction, Request, RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { userModel } from '../models/user';
import logger from '../util/logger';

export const authenticateToken: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Access denied',
        message: 'No token provided',
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        error: 'Access denied',
        message: 'No token provided',
      });
      return;
    }
    if (!process.env.JWT_SECRET) {
      res.status(500).json({
        error: 'Internal server error',
        message: 'Try again later',
      });
      logger.error('JWT_SECRET not set');
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
      id: mongoose.Types.ObjectId;
    };

    const user = await userModel.findById(decoded.id);

    if (!user) {
      res.status(401).json({
        error: 'User not found',
        message: 'Token is valid but user no longer exists',
      });
      return;
    }

    req.user = user;

    next();
  } catch (error) {
    // Check TokenExpiredError first since it extends JsonWebTokenError
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        error: 'Token expired',
        message: 'Please login again',
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        error: 'Invalid token',
        message: 'Token is malformed or expired',
      });
      return;
    }

    next(error);
  }
};

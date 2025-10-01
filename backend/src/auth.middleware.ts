import { NextFunction, Request, RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { userModel } from './user.model';

export const authenticateToken: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      res.status(401).json({
        error: 'Access denied',
        message: 'No token provided',
      });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: mongoose.Types.ObjectId;
    };

    if (!decoded || !decoded.id) {
      res.status(401).json({
        error: 'Invalid token',
        message: 'Token verification failed',
      });
      return;
    }

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
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        error: 'Invalid token',
        message: 'Token is malformed or expired',
      });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        error: 'Token expired',
        message: 'Please login again',
      });
      return;
    }

    next(error);
  }
};

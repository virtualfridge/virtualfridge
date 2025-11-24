import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { authenticateToken } from '../../../middleware/auth';
import { userModel } from '../../../models/user';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../../../models/user');

const mockedJwt = jwt as jest.Mocked<typeof jwt>;
const mockedUserModel = userModel as jest.Mocked<typeof userModel>;

describe('auth middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  const mockUserId = new mongoose.Types.ObjectId();
  const mockUser = {
    _id: mockUserId,
    googleId: 'test-google-id',
    email: 'test@example.com',
    name: 'Test User',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
    mockNext = jest.fn();
  });

  describe('authenticateToken', () => {
    test('should authenticate valid token and attach user to request', async () => {
      const validToken = 'valid-jwt-token';
      mockRequest = {
        headers: {
          authorization: `Bearer ${validToken}`,
        },
      };

      mockedJwt.verify = jest.fn().mockReturnValue({ id: mockUserId });
      mockedUserModel.findById = jest.fn().mockResolvedValue(mockUser);

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockedJwt.verify).toHaveBeenCalledWith(validToken, process.env.JWT_SECRET);
      expect(mockedUserModel.findById).toHaveBeenCalledWith(mockUserId);
      expect((mockRequest as any).user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    test('should return 401 when no token is provided', async () => {
      mockRequest = {
        headers: {},
      };

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Access denied',
        message: 'No token provided',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 401 when authorization header is missing', async () => {
      mockRequest = {
        headers: {
          authorization: undefined,
        },
      };

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Access denied',
        message: 'No token provided',
      });
    });

    test('should return 401 when token format is invalid', async () => {
      mockRequest = {
        headers: {
          authorization: 'InvalidFormat',
        },
      };

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Access denied',
        message: 'No token provided',
      });
    });

    test('should return 401 when decoded token has no id', async () => {
      const validToken = 'valid-jwt-token';
      mockRequest = {
        headers: {
          authorization: `Bearer ${validToken}`,
        },
      };

      mockedJwt.verify = jest.fn().mockReturnValue({});

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Invalid token',
        message: 'Token verification failed',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 401 when user is not found in database', async () => {
      const validToken = 'valid-jwt-token';
      mockRequest = {
        headers: {
          authorization: `Bearer ${validToken}`,
        },
      };

      mockedJwt.verify = jest.fn().mockReturnValue({ id: mockUserId });
      mockedUserModel.findById = jest.fn().mockResolvedValue(null);

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'User not found',
        message: 'Token is valid but user no longer exists',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 401 for malformed JWT token', async () => {
      const invalidToken = 'malformed-token';
      mockRequest = {
        headers: {
          authorization: `Bearer ${invalidToken}`,
        },
      };

      mockedJwt.verify = jest.fn().mockImplementation(() => {
        throw new jwt.JsonWebTokenError('jwt malformed');
      });

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Invalid token',
        message: 'Token is malformed or expired',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 401 for expired JWT token', async () => {
      const expiredToken = 'expired-token';
      mockRequest = {
        headers: {
          authorization: `Bearer ${expiredToken}`,
        },
      };

      mockedJwt.verify = jest.fn().mockImplementation(() => {
        throw new jwt.TokenExpiredError('jwt expired', new Date());
      });

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Token expired',
        message: 'Please login again',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should call next with error for non-JWT errors', async () => {
      const validToken = 'valid-jwt-token';
      mockRequest = {
        headers: {
          authorization: `Bearer ${validToken}`,
        },
      };

      const genericError = new Error('Database connection failed');
      mockedJwt.verify = jest.fn().mockReturnValue({ id: mockUserId });
      mockedUserModel.findById = jest.fn().mockRejectedValue(genericError);

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(genericError);
      expect(statusMock).not.toHaveBeenCalled();
    });

    test('should fail with Bearer token with extra spaces', async () => {
      const validToken = 'valid-jwt-token';
      mockRequest = {
        headers: {
          authorization: `Bearer  ${validToken}  `, // Extra spaces cause split to fail
        },
      };

      // The token extraction will fail because split(' ')[1] will be empty string
      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Access denied',
        message: 'No token provided',
      });
    });

    test('should handle case-sensitive Bearer prefix', async () => {
      const validToken = 'valid-jwt-token';
      mockRequest = {
        headers: {
          authorization: `bearer ${validToken}`, // Lowercase
        },
      };

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Should fail because it expects "Bearer" with capital B
      expect(statusMock).toHaveBeenCalledWith(401);
    });
  });
});

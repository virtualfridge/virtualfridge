import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import { notFoundHandler, errorHandler } from '../../middleware/errorHandler';

describe('errorHandler middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
  });

  describe('notFoundHandler', () => {
    test('should return 404 with route not found message', () => {
      mockRequest = {
        method: 'GET',
        originalUrl: '/api/nonexistent',
      };

      notFoundHandler(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Route not found',
        message: 'Cannot GET /api/nonexistent',
        timestamp: expect.any(String),
        path: '/api/nonexistent',
        method: 'GET',
      });
    });

    test('should include correct HTTP method in response', () => {
      mockRequest = {
        method: 'POST',
        originalUrl: '/api/users',
      };

      notFoundHandler(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Cannot POST /api/users',
          method: 'POST',
        })
      );
    });

    test('should include ISO timestamp', () => {
      mockRequest = {
        method: 'GET',
        originalUrl: '/api/test',
      };

      notFoundHandler(mockRequest as Request, mockResponse as Response);

      const callArgs = jsonMock.mock.calls[0][0];
      expect(callArgs.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    test('should handle different HTTP methods', () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

      methods.forEach((method) => {
        jest.clearAllMocks();
        mockRequest = {
          method,
          originalUrl: '/api/test',
        };

        notFoundHandler(mockRequest as Request, mockResponse as Response);

        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            message: `Cannot ${method} /api/test`,
            method,
          })
        );
      });
    });

    test('should handle complex URLs with query parameters', () => {
      mockRequest = {
        method: 'GET',
        originalUrl: '/api/users?page=1&limit=10',
      };

      notFoundHandler(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/users?page=1&limit=10',
        })
      );
    });

    test('should handle root path', () => {
      mockRequest = {
        method: 'GET',
        originalUrl: '/',
      };

      notFoundHandler(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Cannot GET /',
          path: '/',
        })
      );
    });
  });

  describe('errorHandler', () => {
    test('should return 500 for generic errors', () => {
      const error = new Error('Something went wrong');
      mockRequest = {} as Request;

      errorHandler(error, mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Internal server error',
      });
    });

    test('should handle error with custom message', () => {
      const error = new Error('Database connection failed');
      mockRequest = {} as Request;

      errorHandler(error, mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Internal server error',
      });
    });

    test('should handle error without message', () => {
      const error = new Error();
      mockRequest = {} as Request;

      errorHandler(error, mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Internal server error',
      });
    });

    test('should handle errors with stack trace', () => {
      const error = new Error('Test error with stack');
      error.stack = 'Error: Test error\n    at someFunction (file.js:10:5)';
      mockRequest = {} as Request;

      errorHandler(error, mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Internal server error',
      });
    });

    test('should call status and json methods', () => {
      const error = new Error('Test error');
      mockRequest = {} as Request;

      errorHandler(error, mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalled();
    });
  });
});

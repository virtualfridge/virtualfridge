import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateBody, validateParams, validateQuery } from '../../middleware/validation';

describe('validation middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
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
    mockNext = jest.fn();
  });

  describe('validateBody', () => {
    const testSchema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
      age: z.number().optional(),
    });

    test('should pass validation with valid data', () => {
      mockRequest = {
        body: {
          name: 'John Doe',
          email: 'john@example.com',
          age: 25,
        },
      };

      const middleware = validateBody(testSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
      expect(mockRequest.body).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
        age: 25,
      });
    });

    test('should pass validation with missing optional fields', () => {
      mockRequest = {
        body: {
          name: 'John Doe',
          email: 'john@example.com',
        },
      };

      const middleware = validateBody(testSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    test('should return 400 for invalid email format', () => {
      mockRequest = {
        body: {
          name: 'John Doe',
          email: 'invalid-email',
        },
      };

      const middleware = validateBody(testSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Validation error',
        message: 'Invalid input data',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
            message: expect.any(String),
          }),
        ]),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 400 for missing required fields', () => {
      mockRequest = {
        body: {
          name: 'John Doe',
        },
      };

      const middleware = validateBody(testSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Validation error',
        message: 'Invalid input data',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
          }),
        ]),
      });
    });

    test('should return 400 for empty string in required field', () => {
      mockRequest = {
        body: {
          name: '',
          email: 'john@example.com',
        },
      };

      const middleware = validateBody(testSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation error',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'name',
            }),
          ]),
        })
      );
    });

    test('should return 400 for multiple validation errors', () => {
      mockRequest = {
        body: {
          name: '',
          email: 'invalid',
        },
      };

      const middleware = validateBody(testSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      const response = jsonMock.mock.calls[0][0];
      expect(response.details).toHaveLength(2);
    });

    test('should handle non-Zod errors', () => {
      const brokenSchema = {
        parse: () => {
          throw new Error('Unexpected error');
        },
      } as any;

      mockRequest = {
        body: { data: 'test' },
      };

      const middleware = validateBody(brokenSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Validation processing failed',
      });
    });

    test('should strip extra fields not in schema', () => {
      mockRequest = {
        body: {
          name: 'John Doe',
          email: 'john@example.com',
          extraField: 'should be removed',
        },
      };

      const middleware = validateBody(testSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.body).not.toHaveProperty('extraField');
    });
  });

  describe('validateParams', () => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    test('should pass validation with valid params', () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      mockRequest = {
        params: { id: validUuid },
      };

      const middleware = validateParams(paramsSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    test('should return 400 for invalid UUID format', () => {
      mockRequest = {
        params: { id: 'invalid-uuid' },
      };

      const middleware = validateParams(paramsSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Validation error',
        message: 'Invalid input data',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'id',
          }),
        ]),
      });
    });

    test('should handle non-Zod errors in params validation', () => {
      const brokenSchema = {
        parse: () => {
          throw new Error('Unexpected error');
        },
      } as any;

      mockRequest = {
        params: { id: 'test' },
      };

      const middleware = validateParams(brokenSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Validation processing failed',
      });
    });
  });

  describe('validateQuery', () => {
    const querySchema = z.object({
      page: z.string().regex(/^\d+$/),
      limit: z.string().regex(/^\d+$/).optional(),
      search: z.string().optional(),
    });

    test('should pass validation with valid query params', () => {
      mockRequest = {
        query: {
          page: '1',
          limit: '10',
          search: 'test',
        },
      };

      const middleware = validateQuery(querySchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    test('should pass validation with only required query params', () => {
      mockRequest = {
        query: {
          page: '1',
        },
      };

      const middleware = validateQuery(querySchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    test('should return 400 for invalid query format', () => {
      mockRequest = {
        query: {
          page: 'invalid',
        },
      };

      const middleware = validateQuery(querySchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Validation error',
        message: 'Invalid input data',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'page',
          }),
        ]),
      });
    });

    test('should return 400 for missing required query params', () => {
      mockRequest = {
        query: {},
      };

      const middleware = validateQuery(querySchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    test('should handle non-Zod errors in query validation', () => {
      const brokenSchema = {
        parse: () => {
          throw new Error('Unexpected error');
        },
      } as any;

      mockRequest = {
        query: { page: '1' },
      };

      const middleware = validateQuery(brokenSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Validation processing failed',
      });
    });

    test('should handle nested field paths in error details', () => {
      const nestedSchema = z.object({
        user: z.object({
          profile: z.object({
            name: z.string().min(1),
          }),
        }),
      });

      mockRequest = {
        body: {
          user: {
            profile: {
              name: '',
            },
          },
        },
      };

      const middleware = validateBody(nestedSchema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'user.profile.name',
            }),
          ]),
        })
      );
    });
  });
});

/**
 * Validation Middleware - Error Path Coverage
 *
 * Tests validation.ts error handling for all three validation middlewares
 *
 * Coverage targets:
 * - validateBody: lines 13-21 (ZodError), lines 23-27 (non-ZodError)
 * - validateParams: lines 40-48 (ZodError), lines 51-55 (non-ZodError)
 * - validateQuery: lines 72-80 (ZodError), lines 83-87 (non-ZodError)
 */

import { describe, expect, test, jest, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createTestApp } from '../helpers/testApp';
import * as dbHandler from '../helpers/dbHandler';
import { userModel } from '../../models/user';
import { mockGoogleUserInfo } from '../helpers/testData';

describe('Validation Middleware - Error Paths', () => {
  const app = createTestApp();
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    await dbHandler.connect();
  });

  beforeEach(async () => {
    const user = await userModel.create(mockGoogleUserInfo);
    userId = user._id.toString();
    authToken = jwt.sign({ id: userId }, process.env.JWT_SECRET!, { expiresIn: '1h' });
  });

  afterEach(async () => {
    await dbHandler.clearDatabase();
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  /**
   * ==========================================================================
   * validateBody - ZodError Path (lines 13-21)
   * ==========================================================================
   */

  /**
   * Test: validateBody with missing required fields
   * Tests validation.ts lines 13-27 (ZodError handling)
   */
  test('should return 400 if body fails validation (validateBody ZodError)', async () => {
    // POST /api/food-item expects { typeId: string, percentLeft: number }
    const response = await request(app)
      .post('/api/food-item')
      .set('Authorization', `Bearer ${authToken}`)
      .send({}) // Missing required fields
      .expect(400);

    expect(response.body).toHaveProperty('error', 'Validation error');
    expect(response.body).toHaveProperty('message', 'Invalid input data');
    expect(Array.isArray(response.body.details)).toBe(true);
    expect(response.body.details.length).toBeGreaterThan(0);

    console.log('[TEST] ✓ validateBody returned 400 for ZodError (lines 13-27)');
  });

  /**
   * Test: validateBody with wrong data type
   * Tests validation.ts lines 13-27 with type mismatch
   */
  test('should return 400 if body has wrong data type (validateBody ZodError)', async () => {
    const response = await request(app)
      .post('/api/food-item')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ typeId: 123 }) // Number instead of string
      .expect(400);

    expect(response.body.error).toBe('Validation error');
    expect(response.body.details).toBeDefined();

    console.log('[TEST] ✓ validateBody handled type mismatch (lines 13-27)');
  });

  /**
   * ==========================================================================
   * validateBody - Non-ZodError Path (lines 23-27)
   * ==========================================================================
   */

  /**
   * Test: validateBody non-ZodError handling
   * Tests validation.ts lines 23-27 (defensive error handling)
   *
   * Triggers the else branch by making schema.parse() throw a non-ZodError
   */
  test('should return 500 if non-ZodError is thrown in validateBody', async () => {
    const { validateBody } = require('../../middleware/validation');

    // Create a mock schema that throws non-ZodError
    const mockSchema = {
      parse: jest.fn().mockImplementation(() => {
        throw new Error('Unexpected parsing error');
      }),
    };

    // Create mock Express objects
    const req: any = { body: { test: 'data' } };
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    // Execute middleware
    const middleware = validateBody(mockSchema);
    middleware(req, res, next);

    // Verify 500 response
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal server error',
      message: 'Validation processing failed',
    });
    expect(next).not.toHaveBeenCalled();

    console.log('[TEST] ✓ validateBody returned 500 for non-ZodError (lines 23-27)');
  });

  /**
   * ==========================================================================
   * validateParams - ZodError Path (lines 40-48)
   * ==========================================================================
   */

  /**
   * Test: validateParams with invalid ID format
   * Tests validation.ts lines 46-54 (ZodError in validateParams)
   */
  test('should return 400 if params fail validation (validateParams ZodError)', async () => {
    const response = await request(app)
      .get('/api/food-item/invalid-id-format')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(400);

    expect(response.body).toHaveProperty('error', 'Validation error');
    expect(response.body).toHaveProperty('message', 'Invalid input data');
    expect(Array.isArray(response.body.details)).toBe(true);

    console.log('[TEST] ✓ validateParams returned 400 for ZodError (lines 40-48)');
  });


  /**
   * ==========================================================================
   * validateParams - Non-ZodError Path (lines 51-55)
   * ==========================================================================
   */

  /**
   * Test: validateParams non-ZodError handling
   * Tests validation.ts lines 51-55 (defensive error handling)
   */
  test('should return 500 if non-ZodError is thrown in validateParams', async () => {
    const { validateParams } = require('../../middleware/validation');

    const mockSchema = {
      parse: jest.fn().mockImplementation(() => {
        throw new Error('Unexpected params error');
      }),
    };

    const req: any = { params: { id: '123' } };
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    const middleware = validateParams(mockSchema);
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal server error',
      message: 'Validation processing failed',
    });
    expect(next).not.toHaveBeenCalled();

    console.log('[TEST] ✓ validateParams returned 500 for non-ZodError (lines 51-55)');
  });

  /**
   * ==========================================================================
   * validateQuery - ZodError Path (lines 72-80)
   * ==========================================================================
   */


  /**
   * ==========================================================================
   * validateQuery - Non-ZodError Path (lines 83-87)
   * ==========================================================================
   */

  /**
   * Test: validateQuery non-ZodError handling
   * Tests validation.ts lines 83-87 (defensive error handling)
   */
  test('should return 500 if non-ZodError is thrown in validateQuery', async () => {
    const { validateQuery } = require('../../middleware/validation');

    const mockSchema = {
      parse: jest.fn().mockImplementation(() => {
        throw new Error('Unexpected query error');
      }),
    };

    const req: any = { query: { page: '1' } };
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    const middleware = validateQuery(mockSchema);
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal server error',
      message: 'Validation processing failed',
    });
    expect(next).not.toHaveBeenCalled();

    console.log('[TEST] ✓ validateQuery returned 500 for non-ZodError (lines 83-87)');
  });

  /**
   * ==========================================================================
   * Additional Edge Cases
   * ==========================================================================
   */

  /**
   * Test: validateBody success path
   * Verifies that valid data passes through
   */
  test('should pass valid body data through validateBody', async () => {
    const mongoose = await import('mongoose');
    const typeId = new mongoose.Types.ObjectId().toString();

    const response = await request(app)
      .post('/api/food-item')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        userId,
        typeId,
        percentLeft: 100,
      })
      .expect(200);

    expect(response.body.message).toBe('FoodItem created successfully');

    console.log('[TEST] ✓ validateBody passed valid data through');
  });


  /**
   * Test: Multiple validation errors in details array
   * Tests that multiple field errors are captured in details
   */
  test('should return multiple validation errors in details array', async () => {
    const response = await request(app)
      .post('/api/food-item')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        // Missing required fields: userId, typeId, percentLeft
      })
      .expect(400);

    expect(response.body.error).toBe('Validation error');
    expect(Array.isArray(response.body.details)).toBe(true);
    expect(response.body.details.length).toBeGreaterThan(0);

    // Check that details have field and message properties
    response.body.details.forEach((detail: any) => {
      expect(detail).toHaveProperty('field');
      expect(detail).toHaveProperty('message');
    });

    console.log('[TEST] ✓ Returned multiple validation errors in details');
  });
});

console.log('✓ Validation error tests loaded');

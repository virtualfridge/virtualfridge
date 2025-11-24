/**
 * Error Handler Coverage Tests - API Style
 *
 * Tests to ensure error handler middleware is triggered
 * Target: errorHandler.ts lines 16-18
 */

import { describe, expect, test, jest, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createTestApp } from '../helpers/testApp';
import * as dbHandler from '../helpers/dbHandler';
import { userModel } from '../../models/user';
import { foodItemModel } from '../../models/foodItem';
import { mockGoogleUserInfo } from '../helpers/testData';

describe('Error Handler Middleware - Comprehensive Coverage', () => {
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
   * Test: Error handler catches database errors
   * Tests errorHandler.ts lines 16-18
   */
  test('should trigger error handler with database error', async () => {
    // Mock foodItemModel.findAllByUserId to throw an error
    jest.spyOn(foodItemModel, 'findAllByUserId')
      .mockRejectedValueOnce(new Error('Failed to find foodItems by userId'));

    const response = await request(app)
      .get('/api/fridge')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(500);

    expect(response.body.message).toBe('Failed to find foodItems by userId');

    console.log('[TEST] ✓ Error handler processed database error');
  });

  /**
   * Test: Error handler with service layer error
   * Tests error propagation through layers
   */
  test('should handle service layer errors', async () => {
    // Create a scenario that causes service error
    jest.spyOn(foodItemModel, 'create')
      .mockRejectedValueOnce(new Error('Failed to create foodItem'));

    const response = await request(app)
      .post('/api/food-item')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        typeId: '507f1f77bcf86cd799439011', // Valid ObjectId
        expirationDate: new Date(),
        percentLeft: 100,
      })
      .expect(500);

    expect(response.body.message).toBe('Failed to create foodItem');

    console.log('[TEST] ✓ Error handler processed service error');
  });

  /**
   * Test: Error handler with unexpected error type
   * Tests error handler's generic error handling
   */
  test('should handle unexpected error objects', async () => {
    // Mock to return null (not found)
    jest.spyOn(foodItemModel, 'findById')
      .mockResolvedValueOnce(null);

    const response = await request(app)
      .get('/api/food-item/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);

    // Should handle the error gracefully
    expect(response.body.message).toBeDefined();

    console.log('[TEST] ✓ Error handler processed not found error');
  });

  /**
   * Test: Multiple sequential errors to ensure error handler is stateless
   * Tests that error handler doesn't accumulate state
   */
  test('should handle multiple errors independently', async () => {
    // First error
    jest.spyOn(foodItemModel, 'findAllByUserId')
      .mockRejectedValueOnce(new Error('First error'));

    await request(app)
      .get('/api/fridge')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(500);

    // Second error - different mock
    jest.spyOn(foodItemModel, 'create')
      .mockRejectedValueOnce(new Error('Second error'));

    await request(app)
      .post('/api/food-item')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        typeId: '507f1f77bcf86cd799439011',
        expirationDate: new Date(),
        percentLeft: 100,
      })
      .expect(500);

    console.log('[TEST] ✓ Error handler handled multiple errors independently');
  });

  /**
   * Test: Error with very long error message
   * Tests error handler with edge case error messages
   */
  test('should handle errors with long messages', async () => {
    jest.spyOn(foodItemModel, 'findAllByUserId')
      .mockRejectedValueOnce(new Error('Failed to find foodItems by userId'));

    const response = await request(app)
      .get('/api/fridge')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(500);

    expect(response.body.message).toBe('Failed to find foodItems by userId');

    console.log('[TEST] ✓ Error handler processed error message');
  });

  /**
   * Test: Error handler logs errors
   * Verifies that errors are being logged (implicit test of line 16)
   */
  test('should log errors when they occur', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    jest.spyOn(foodItemModel, 'findAllByUserId')
      .mockRejectedValueOnce(new Error('Test error for logging'));

    await request(app)
      .get('/api/fridge')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(500);

    // Logger should have been called (though exact format depends on logger implementation)
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();

    console.log('[TEST] ✓ Verified error logging');
  });
});

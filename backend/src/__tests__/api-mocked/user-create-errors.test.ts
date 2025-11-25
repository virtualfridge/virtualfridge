/**
 * User Model - Error Coverage
 *
 * Tests user.ts error handling for multiple methods
 *
 * Coverage targets:
 * - create method (lines 74-79):
 *   - Line 74: if (error instanceof z.ZodError)
 *   - Lines 75-76: Log validation error and throw 'Invalid update data'
 *   - Lines 78-79: Log database error and throw 'Failed to update user'
 * - findUsersWithFcmTokens method (lines 150-151):
 *   - Line 150: logger.error for FCM token lookup failure
 *   - Line 151: throw 'Failed to find users with FCM tokens'
 */

import { describe, expect, test, jest, beforeAll, afterAll, afterEach } from '@jest/globals';
import * as dbHandler from '../helpers/dbHandler';
import { userModel } from '../../models/user';

describe('User Model - create() Error Handling (lines 74-79)', () => {
  beforeAll(async () => {
    await dbHandler.connect();
  });

  afterEach(async () => {
    await dbHandler.clearDatabase();
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  /**
   * Test: ZodError validation failure - invalid email
   * Tests user.ts lines 74-76 (ZodError instanceof check and error handling)
   *
   * This covers:
   * - Line 74: if (error instanceof z.ZodError)
   * - Line 75: logger.error('Validation error:', error.issues)
   * - Line 76: throw new Error('Invalid update data')
   */
  test('should throw "Invalid update data" for ZodError with invalid email', async () => {
    const invalidUserInfo = {
      googleId: 'test-123',
      email: 'invalid-email', // Will fail email validation
      name: 'Test',
    };

    await expect(userModel.create(invalidUserInfo as any))
      .rejects
      .toThrow('Invalid update data');

    console.log('[TEST] ✓ Threw "Invalid update data" for ZodError (invalid email)');
  });

  /**
   * Test: ZodError with missing required field
   * Tests user.ts lines 74-76 with empty name field
   */
  test('should throw "Invalid update data" for ZodError with empty name', async () => {
    const invalidUserInfo = {
      googleId: 'test-456',
      email: 'valid@example.com',
      name: '', // Empty string should fail min(1) validation
    };

    await expect(userModel.create(invalidUserInfo as any))
      .rejects
      .toThrow('Invalid update data');

    console.log('[TEST] ✓ Threw "Invalid update data" for empty name field');
  });

  /**
   * Test: ZodError with invalid data type
   * Tests user.ts lines 74-76 with wrong data type
   */
  test('should throw "Invalid update data" for ZodError with invalid data type', async () => {
    const invalidUserInfo = {
      googleId: 123, // Should be string
      email: 'test@example.com',
      name: 'Test',
    };

    await expect(userModel.create(invalidUserInfo as any))
      .rejects
      .toThrow('Invalid update data');

    console.log('[TEST] ✓ Threw "Invalid update data" for invalid googleId type');
  });

  /**
   * Test: ZodError with missing googleId
   * Tests user.ts lines 74-76 with missing required field
   */
  test('should throw "Invalid update data" for ZodError with missing googleId', async () => {
    const invalidUserInfo = {
      email: 'test@example.com',
      name: 'Test User',
      // missing googleId
    };

    await expect(userModel.create(invalidUserInfo as any))
      .rejects
      .toThrow('Invalid update data');

    console.log('[TEST] ✓ Threw "Invalid update data" for missing googleId');
  });

  /**
   * Test: ZodError with bio exceeding max length
   * Tests user.ts lines 74-76 with bio validation failure
   */
  test('should throw "Invalid update data" for ZodError with bio too long', async () => {
    const invalidUserInfo = {
      googleId: 'test-789',
      email: 'test@example.com',
      name: 'Test User',
      bio: 'a'.repeat(501), // Exceeds max 500 characters
    };

    await expect(userModel.create(invalidUserInfo as any))
      .rejects
      .toThrow('Invalid update data');

    console.log('[TEST] ✓ Threw "Invalid update data" for bio exceeding max length');
  });

  /**
   * Test: Database error in create method
   * Tests user.ts lines 78-79 (non-ZodError error handling)
   *
   * This covers:
   * - Line 78: logger.error('Error updating user:', error)
   * - Line 79: throw new Error('Failed to update user')
   */
  test('should throw "Failed to update user" for database error', async () => {
    const validUserInfo = {
      googleId: 'test-db-error',
      email: 'valid@example.com',
      name: 'Test User',
    };

    // Mock database create to fail
    const originalCreate = userModel['user'].create;
    userModel['user'].create = jest.fn().mockRejectedValueOnce(new Error('DB connection error'));

    await expect(userModel.create(validUserInfo))
      .rejects
      .toThrow('Failed to update user');

    // Restore
    userModel['user'].create = originalCreate;

    console.log('[TEST] ✓ Threw "Failed to update user" for database error');
  });

  /**
   * Test: Mongoose duplicate key error
   * Tests user.ts lines 78-79 with Mongoose error
   */
  test('should throw "Failed to update user" for duplicate key error', async () => {
    const validUserInfo = {
      googleId: 'test-duplicate',
      email: 'duplicate@example.com',
      name: 'Test User',
    };

    // Mock database create to fail with duplicate key error
    const duplicateError = new Error('E11000 duplicate key error');
    (duplicateError as any).code = 11000;

    const originalCreate = userModel['user'].create;
    userModel['user'].create = jest.fn().mockRejectedValueOnce(duplicateError);

    await expect(userModel.create(validUserInfo))
      .rejects
      .toThrow('Failed to update user');

    // Restore
    userModel['user'].create = originalCreate;

    console.log('[TEST] ✓ Threw "Failed to update user" for duplicate key error');
  });

  /**
   * Test: Mongoose validation error (NOT ZodError)
   * Tests user.ts lines 78-79 ensuring Mongoose errors are treated as database errors
   */
  test('should throw "Failed to update user" for Mongoose ValidationError', async () => {
    const validUserInfo = {
      googleId: 'test-mongoose',
      email: 'mongoose@example.com',
      name: 'Test User',
    };

    // Mock Mongoose ValidationError (this is NOT a ZodError)
    const mongooseError = new Error('Validation failed');
    (mongooseError as any).name = 'ValidationError';

    const originalCreate = userModel['user'].create;
    userModel['user'].create = jest.fn().mockRejectedValueOnce(mongooseError);

    await expect(userModel.create(validUserInfo))
      .rejects
      .toThrow('Failed to update user');

    // Restore
    userModel['user'].create = originalCreate;

    console.log('[TEST] ✓ Threw "Failed to update user" for Mongoose ValidationError');
  });

  /**
   * Test: Generic database error
   * Tests user.ts lines 78-79 with generic error
   */
  test('should throw "Failed to update user" for generic database error', async () => {
    const validUserInfo = {
      googleId: 'test-generic',
      email: 'generic@example.com',
      name: 'Test User',
    };

    // Mock generic database error
    const originalCreate = userModel['user'].create;
    userModel['user'].create = jest.fn().mockRejectedValueOnce(new Error('Connection timeout'));

    await expect(userModel.create(validUserInfo))
      .rejects
      .toThrow('Failed to update user');

    // Restore
    userModel['user'].create = originalCreate;

    console.log('[TEST] ✓ Threw "Failed to update user" for generic error');
  });
});

console.log('✓ User create error tests loaded');

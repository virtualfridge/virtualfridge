/**
 * CronService Error Path Coverage - API Tests
 *
 * Tests cronService.ts error handling through API endpoint
 *
 * Coverage targets:
 * - Lines 74-77: Inner catch block when processUserNotifications fails for a user
 * - Lines 83-85: Outer catch block when findUsersWithFcmTokens or entire loop fails
 *
 * API Endpoint: POST /api/notifications/admin/trigger
 */

import { describe, expect, test, jest, beforeAll, afterAll, afterEach, beforeEach } from '@jest/globals';
import request from 'supertest';
import { createTestApp } from '../helpers/testApp';
import * as dbHandler from '../helpers/dbHandler';
import { userModel } from '../../models/user';
import { cronService } from '../../services/cronService';
import logger from '../../util/logger';

describe('CronService - Error Path Coverage via API', () => {
  const app = createTestApp();

  beforeAll(async () => {
    await dbHandler.connect();
  });

  beforeEach(async () => {
    // Ensure cron service is stopped before each test
    cronService.stop();
  });

  afterEach(async () => {
    await dbHandler.clearDatabase();
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  /**
   * Test: Outer catch block (lines 83-85)
   * Tests cronService.ts lines 83-85
   *
   * When findUsersWithFcmTokens() throws an error, the outer catch block
   * should log the error and prevent the server from crashing
   */
  test('should hit outer catch block when findUsersWithFcmTokens fails (lines 83-85)', async () => {
    // Spy on logger.error to verify error logging
    const loggerErrorSpy = jest.spyOn(logger, 'error');

    // Mock findUsersWithFcmTokens to throw an error
    jest.spyOn(userModel, 'findUsersWithFcmTokens')
      .mockRejectedValueOnce(new Error('Database connection error'));

    // Call the API endpoint that triggers the cron service
    const response = await request(app)
      .post('/api/notifications/admin/trigger')
      .expect(200); // Should return 200 even if internal error occurs

    expect(response.body.message).toBe('Notification check triggered successfully. Check server logs for details.');

    // Verify the error was logged (outer catch block executed)
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      'Error in checkAndSendExpirationNotifications:',
      expect.objectContaining({
        message: 'Database connection error'
      })
    );

    console.log('[TEST] ✓ Outer catch block executed when findUsersWithFcmTokens fails (lines 83-85)');
  });

  /**
   * Test: Outer catch block with network timeout error
   * Tests cronService.ts lines 83-85 with different error type
   */
  test('should handle network timeout error in outer catch block', async () => {
    const loggerErrorSpy = jest.spyOn(logger, 'error');

    // Mock timeout error
    const timeoutError = new Error('Network timeout');
    (timeoutError as any).code = 'ETIMEDOUT';

    jest.spyOn(userModel, 'findUsersWithFcmTokens')
      .mockRejectedValueOnce(timeoutError);

    const response = await request(app)
      .post('/api/notifications/admin/trigger')
      .expect(200);

    expect(response.body.message).toBe('Notification check triggered successfully. Check server logs for details.');

    // Verify error was logged
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      'Error in checkAndSendExpirationNotifications:',
      expect.objectContaining({
        message: 'Network timeout'
      })
    );

    console.log('[TEST] ✓ Outer catch block handled network timeout error');
  });

  /**
   * Test: Inner catch block (lines 74-77)
   * Tests cronService.ts lines 74-77
   *
   * When processUserNotifications() fails for a specific user, the inner catch
   * block should log the error and continue processing other users
   */
  test('should hit inner catch block when processUserNotifications fails for a user (lines 74-77)', async () => {
    const loggerErrorSpy = jest.spyOn(logger, 'error');

    // Create a user with FCM token
    const user = await userModel.create({
      googleId: 'test-error-user',
      email: 'error@example.com',
      name: 'Error Test User',
      profilePicture: 'https://example.com/pic.jpg',
      fcmToken: 'test-fcm-token-error',
    });

    // Mock findUsersWithFcmTokens to return the user
    jest.spyOn(userModel, 'findUsersWithFcmTokens')
      .mockResolvedValueOnce([user as any]);

    // Mock processUserNotifications (private method) to throw an error
    // We need to spy on the private method using bracket notation
    jest.spyOn(cronService as any, 'processUserNotifications')
      .mockRejectedValueOnce(new Error('Processing failed for user'));

    // Call the API endpoint
    const response = await request(app)
      .post('/api/notifications/admin/trigger')
      .expect(200);

    expect(response.body.message).toBe('Notification check triggered successfully. Check server logs for details.');

    // Verify the error was logged (inner catch block executed)
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining(`Error processing notifications for user ${user._id}`),
      expect.objectContaining({
        message: 'Processing failed for user'
      })
    );

    console.log('[TEST] ✓ Inner catch block executed when processUserNotifications fails (lines 74-77)');
  });

  /**
   * Test: Inner catch block with multiple users (one fails, others succeed)
   * Verifies that when one user's processing fails, other users are still processed
   */
  test('should continue processing other users when one user fails (inner catch)', async () => {
    const loggerErrorSpy = jest.spyOn(logger, 'error');
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    // Create two users
    const user1 = await userModel.create({
      googleId: 'test-user-1',
      email: 'user1@example.com',
      name: 'User 1',
      profilePicture: 'https://example.com/pic1.jpg',
      fcmToken: 'token-1',
    });

    const user2 = await userModel.create({
      googleId: 'test-user-2',
      email: 'user2@example.com',
      name: 'User 2',
      profilePicture: 'https://example.com/pic2.jpg',
      fcmToken: 'token-2',
    });

    // Mock findUsersWithFcmTokens to return both users
    jest.spyOn(userModel, 'findUsersWithFcmTokens')
      .mockResolvedValueOnce([user1 as any, user2 as any]);

    // Mock processUserNotifications to fail for first user, succeed for second
    const processSpy = jest.spyOn(cronService as any, 'processUserNotifications')
      .mockRejectedValueOnce(new Error('User 1 processing failed'))
      .mockResolvedValueOnce({ sent: false });

    // Call the API endpoint
    const response = await request(app)
      .post('/api/notifications/admin/trigger')
      .expect(200);

    // Verify both users were attempted to be processed
    expect(processSpy).toHaveBeenCalledTimes(2);

    // Verify error was logged for user 1 (inner catch)
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining(`Error processing notifications for user ${user1._id}`),
      expect.any(Error)
    );

    // Verify the summary log shows: 1 user processed (user2), 0 notifications sent, 1 error
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Users processed: 1, Notifications sent: 0, Errors: 1')
    );

    consoleLogSpy.mockRestore();

    console.log('[TEST] ✓ Inner catch block allowed processing to continue for other users');
  });

  /**
   * Test: Inner catch block with TypeError
   * Tests that different error types are handled correctly
   */
  test('should handle TypeError in inner catch block', async () => {
    const loggerErrorSpy = jest.spyOn(logger, 'error');

    const user = await userModel.create({
      googleId: 'test-type-error',
      email: 'typeerror@example.com',
      name: 'Type Error User',
      profilePicture: 'https://example.com/pic.jpg',
      fcmToken: 'test-token-type-error',
    });

    jest.spyOn(userModel, 'findUsersWithFcmTokens')
      .mockResolvedValueOnce([user as any]);

    // Mock to throw TypeError
    jest.spyOn(cronService as any, 'processUserNotifications')
      .mockRejectedValueOnce(new TypeError('Cannot read property of undefined'));

    const response = await request(app)
      .post('/api/notifications/admin/trigger')
      .expect(200);

    // Verify TypeError was logged
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining(`Error processing notifications for user ${user._id}`),
      expect.objectContaining({
        message: 'Cannot read property of undefined'
      })
    );

    console.log('[TEST] ✓ Inner catch block handled TypeError correctly');
  });

  /**
   * Test: Verify API endpoint exists and responds
   * Basic sanity test to ensure the endpoint is accessible
   */
  test('should respond 200 from /api/notifications/admin/trigger endpoint', async () => {
    // Mock to return empty array (no users with FCM tokens)
    jest.spyOn(userModel, 'findUsersWithFcmTokens')
      .mockResolvedValueOnce([]);

    const response = await request(app)
      .post('/api/notifications/admin/trigger')
      .expect(200);

    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toBe('Notification check triggered successfully. Check server logs for details.');

    console.log('[TEST] ✓ API endpoint responded successfully');
  });
});

console.log('✓ CronService error path API tests loaded');

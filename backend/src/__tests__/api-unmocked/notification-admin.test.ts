/**
 * Notification Admin API Tests - WITHOUT ADDITIONAL MOCKING
 *
 * Tests for notification admin/testing endpoints
 * API Endpoints:
 * - POST /api/notifications/admin/trigger - Manual trigger notification check
 * - GET /api/notifications/admin/debug - Get debug info
 */

import { describe, expect, test, beforeAll, afterAll, afterEach } from '@jest/globals';
import request from 'supertest';
import { createTestApp } from '../helpers/testApp';
import * as dbHandler from '../helpers/dbHandler';

/**
 * =============================================================================
 * TEST SUITE FOR: POST /api/notifications/admin/trigger
 * =============================================================================
 */

describe('POST /api/notifications/admin/trigger - WITHOUT ADDITIONAL MOCKING', () => {
  const app = createTestApp();

  beforeAll(async () => {
    await dbHandler.connect();
  });

  afterEach(async () => {
    await dbHandler.clearDatabase();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  /**
   * Test: Trigger notification check successfully
   *
   * Input:
   * - HTTP Method: POST
   * - Endpoint: /api/notifications/admin/trigger
   * - Headers: None (no auth required for admin endpoints)
   * - Body: None
   *
   * Expected Status Code: 200
   *
   * Expected Output:
   * - Response message: "Notification check triggered successfully"
   *
   * Expected Behavior:
   * - Triggers cronService.triggerNotificationCheck()
   * - Checks all users for expiring items
   * - Sends notifications to users with FCM tokens
   * - Returns success message
   *
   * Mocking:
   * - None (real notification check, but won't send actual notifications if no FCM tokens exist)
   */
  test('should trigger notification check successfully', async () => {
    const response = await request(app)
      .post('/api/notifications/admin/trigger')
      .expect(200);

    expect(response.body.message).toContain('Notification check triggered successfully');
  });
});

/**
 * =============================================================================
 * TEST SUITE FOR: GET /api/notifications/admin/debug
 * =============================================================================
 */

describe('GET /api/notifications/admin/debug - WITHOUT ADDITIONAL MOCKING', () => {
  const app = createTestApp();

  beforeAll(async () => {
    await dbHandler.connect();
  });

  afterEach(async () => {
    await dbHandler.clearDatabase();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  /**
   * Test: Get debug info successfully
   *
   * Input:
   * - HTTP Method: GET
   * - Endpoint: /api/notifications/admin/debug
   * - Headers: None (no auth required for admin endpoints)
   * - Body: None
   *
   * Expected Status Code: 200
   *
   * Expected Output:
   * - Response contains firebaseInitialized boolean
   * - Response contains totalUsersWithTokens number
   * - Response contains users array
   *
   * Expected Behavior:
   * - Fetches all users with FCM tokens
   * - For each user, gets their food items
   * - Returns debug information about notification state
   *
   * Mocking:
   * - None (real database queries)
   */
  test('should get debug info successfully', async () => {
    const response = await request(app)
      .get('/api/notifications/admin/debug')
      .expect(200);

    expect(response.body).toHaveProperty('firebaseInitialized');
    expect(response.body).toHaveProperty('totalUsersWithTokens');
    expect(response.body).toHaveProperty('users');
    expect(Array.isArray(response.body.users)).toBe(true);
    expect(typeof response.body.firebaseInitialized).toBe('boolean');
    expect(typeof response.body.totalUsersWithTokens).toBe('number');
  });
});

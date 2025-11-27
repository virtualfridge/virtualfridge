/**
 * Notification Admin API Tests - WITH MOCKING
 *
 * Tests for notification admin/debug endpoints
 * Aims for 100% line coverage of notification-admin routes
 *
 * API Endpoints:
 * - POST /api/notifications/admin/trigger - Manually trigger notification check
 * - GET /api/notifications/admin/debug - Get debug info about notification state
 */

import { describe, expect, test, jest, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import { createTestApp } from '../helpers/testApp';
import * as dbHandler from '../helpers/dbHandler';
import { userModel } from '../../models/user';
import { foodItemModel } from '../../models/foodItem';
import { foodTypeModel } from '../../models/foodType';
import { cronService } from '../../services/cronService';

/**
 * =============================================================================
 * TEST SUITE FOR: POST /api/notifications/admin/trigger
 * =============================================================================
 */

describe('POST /api/notifications/admin/trigger - Trigger Notification Check', () => {
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
   * Test: Successfully trigger notification check
   * Tests notification-admin.ts lines 13-24
   */
  test('should trigger notification check successfully', async () => {
    // Create user with FCM token
    const user = await userModel.create({
      googleId: 'test-trigger-user',
      email: 'trigger@example.com',
      name: 'Trigger Test User',
      profilePicture: 'https://example.com/pic.jpg',
      fcmToken: 'test-fcm-token-trigger',
      notificationPreferences: {
        enableNotifications: true,
        expiryThresholdDays: 2,
      },
    });

    // Create food type and expiring item
    const foodType = await foodTypeModel.create({
      name: 'Test Food',
      nutritionalInfo: {
        calories: 100,
        protein: 1,
        carbohydrates: 20,
        fat: 1,
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await foodItemModel.create({
      userId: user._id,
      typeId: foodType._id,
      expirationDate: today,
      percentLeft: 100,
    });

    // Trigger notification check (no auth required for admin endpoint)
    const response = await request(app)
      .post('/api/notifications/admin/trigger')
      .expect(200);

    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('triggered successfully');

    console.log('[TEST] ✓ Notification check triggered successfully');
  });

  /**
   * Test: Handle errors during trigger
   * Tests notification-admin.ts lines 25-31 (error handling)
   */
  test('should handle errors during notification trigger', async () => {
    // Mock cronService.triggerNotificationCheck to throw error
    jest.spyOn(cronService, 'triggerNotificationCheck').mockRejectedValueOnce(new Error('Trigger failed'));

    const response = await request(app)
      .post('/api/notifications/admin/trigger')
      .expect(500);

    expect(response.body.message).toBe('Failed to trigger notification check');
    expect(response.body.error).toBe('Trigger failed');

    console.log('[TEST] ✓ Handled error during notification trigger');
  });

  /**
   * Test: Trigger works even with no users
   * Tests that endpoint handles empty database gracefully
   */
  test('should handle trigger with no users', async () => {
    const response = await request(app)
      .post('/api/notifications/admin/trigger')
      .expect(200);

    expect(response.body.message).toContain('triggered successfully');

    console.log('[TEST] ✓ Handled trigger with no users');
  });
});

/**
 * =============================================================================
 * TEST SUITE FOR: GET /api/notifications/admin/debug
 * =============================================================================
 */

describe('GET /api/notifications/admin/debug - Get Notification Debug Info', () => {
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
   * Tests notification-admin.ts lines 35-60
   */
  test('should get debug info successfully', async () => {
    // Create multiple users with varying data
    const user1 = await userModel.create({
      googleId: 'debug-user-1',
      email: 'debug1@example.com',
      name: 'Debug User 1',
      profilePicture: 'https://example.com/pic1.jpg',
      fcmToken: 'fcm-token-1',
      notificationPreferences: {
        enableNotifications: true,
        expiryThresholdDays: 2,
      },
    });

    const user2 = await userModel.create({
      googleId: 'debug-user-2',
      email: 'debug2@example.com',
      name: 'Debug User 2',
      profilePicture: 'https://example.com/pic2.jpg',
      fcmToken: 'fcm-token-2',
      notificationPreferences: {
        enableNotifications: true,
        expiryThresholdDays: 3,
      },
    });

    // Create food types
    const foodType = await foodTypeModel.create({
      name: 'Apple',
      nutritionalInfo: {
        calories: 52,
        protein: 0.3,
        carbohydrates: 14,
        fat: 0.2,
      },
    });

    // Create food items for user1
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await foodItemModel.create({
      userId: user1._id,
      typeId: foodType._id,
      expirationDate: today,
      percentLeft: 100,
    });

    await foodItemModel.create({
      userId: user1._id,
      typeId: foodType._id,
      expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      percentLeft: 50,
    });

    // Create food item for user2 (no expiration date)
    await foodItemModel.create({
      userId: user2._id,
      typeId: foodType._id,
      // No expirationDate
      percentLeft: 75,
    });

    // Get debug info (no auth required for admin endpoint)
    const response = await request(app)
      .get('/api/notifications/admin/debug')
      .expect(200);

    expect(response.body).toHaveProperty('firebaseInitialized');
    expect(response.body).toHaveProperty('totalUsersWithTokens', 2);
    expect(response.body).toHaveProperty('users');
    expect(response.body.users).toHaveLength(2);

    // Verify user1 data
    const user1Debug = response.body.users.find((u: any) => u.email === 'debug1@example.com');
    expect(user1Debug).toBeDefined();
    expect(user1Debug.hasFcmToken).toBe(true);
    expect(user1Debug.totalItems).toBe(2);
    expect(user1Debug.itemsWithExpiry).toBe(2);
    expect(user1Debug.expiryThreshold).toBe(2);

    // Verify user2 data
    const user2Debug = response.body.users.find((u: any) => u.email === 'debug2@example.com');
    expect(user2Debug).toBeDefined();
    expect(user2Debug.totalItems).toBe(1);
    expect(user2Debug.itemsWithExpiry).toBe(0);
    expect(user2Debug.expiryThreshold).toBe(3);

    console.log('[TEST] ✓ Got debug info successfully');
  });

  /**
   * Test: Handle debug endpoint with no users
   * Tests that debug works with empty database
   */
  test('should return empty debug info when no users exist', async () => {
    const response = await request(app)
      .get('/api/notifications/admin/debug')
      .expect(200);

    expect(response.body.totalUsersWithTokens).toBe(0);
    expect(response.body.users).toHaveLength(0);

    console.log('[TEST] ✓ Handled debug with no users');
  });

  /**
   * Test: Handle errors during debug
   * Tests notification-admin.ts lines 61-67 (error handling)
   */
  test('should handle errors during debug', async () => {
    // Mock userModel.findUsersWithFcmTokens to throw error
    jest.spyOn(userModel, 'findUsersWithFcmTokens').mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app)
      .get('/api/notifications/admin/debug')
      .expect(500);

    expect(response.body.message).toBe('Debug failed');
    expect(response.body.error).toBe('Database error');

    console.log('[TEST] ✓ Handled error during debug');
  });

  /**
   * Test: Handle errors when fetching food items for user
   * Tests notification-admin.ts lines 44-48 (error handling in loop)
   */
  test('should handle errors when fetching user food items', async () => {
    // Create a user
    await userModel.create({
      googleId: 'error-user',
      email: 'error@example.com',
      name: 'Error User',
      profilePicture: 'https://example.com/pic.jpg',
      fcmToken: 'fcm-token-error',
    });

    // Mock foodItemModel.findAllByUserId to throw error
    jest.spyOn(foodItemModel, 'findAllByUserId').mockRejectedValueOnce(new Error('Item fetch error'));

    const response = await request(app)
      .get('/api/notifications/admin/debug')
      .expect(500);

    expect(response.body.message).toBe('Debug failed');

    console.log('[TEST] ✓ Handled error when fetching user food items');
  });
});

/**
 * Notification Check API Tests - COMPREHENSIVE COVERAGE
 *
 * Tests for the authenticated notification check endpoint
 * API Endpoint:
 * - POST /api/notifications/check - Check for expiring items and send notification
 *
 * This endpoint is called when the app opens to check for expiring items
 * Requires authentication
 */

import { describe, expect, test, jest, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { createTestApp } from '../helpers/testApp';
import * as dbHandler from '../helpers/dbHandler';
import { userModel } from '../../models/user';
import { foodItemModel } from '../../models/foodItem';
import { foodTypeModel } from '../../models/foodType';
import { notificationService } from '../../services/notification';
import { mockGoogleUserInfo } from '../helpers/testData';

/**
 * =============================================================================
 * TEST SUITE FOR: POST /api/notifications/check
 * =============================================================================
 */

describe('POST /api/notifications/check - Check Expiring Items', () => {
  const app = createTestApp();
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    await dbHandler.connect();
  });

  beforeEach(async () => {
    const user = await userModel.create({
      ...mockGoogleUserInfo,
      fcmToken: 'test-fcm-token',
      notificationPreferences: {
        enableNotifications: true,
        expiryThresholdDays: 2,
      },
    });
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
   * Test: Successfully send notification with expiring items
   * Tests notification.ts lines 17-93
   */
  test('should send notification for expiring items', async () => {
    // Mock notification service
    jest.spyOn(notificationService, 'sendExpiryNotifications').mockResolvedValueOnce(true);

    // Create food type
    const foodType = await foodTypeModel.create({
      name: 'Apple',
      nutrients: { calories: '52' },
    });

    // Create expiring food item (expires today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await foodItemModel.create({
      userId: new mongoose.Types.ObjectId(userId),
      typeId: foodType._id,
      expirationDate: today,
      percentLeft: 100,
    });

    const response = await request(app)
      .post('/api/notifications/check')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.message).toBe('Found 1 expiring item(s)');
    expect(response.body.itemsExpiring).toBe(1);
    expect(response.body.notificationSent).toBe(true);

    console.log('[TEST] ✓ Sent notification for expiring items');
  });

  /**
   * Test: Handle multiple expiring items
   * Tests notification.ts lines 56-76 (loop over items)
   */
  test('should handle multiple expiring items', async () => {
    jest.spyOn(notificationService, 'sendExpiryNotifications').mockResolvedValueOnce(true);

    const foodType1 = await foodTypeModel.create({
      name: 'Apple',
      nutrients: { calories: '52' },
    });

    const foodType2 = await foodTypeModel.create({
      name: 'Banana',
      nutrients: { calories: '89' },
    });

    // Create two expiring items
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    await foodItemModel.create({
      userId: new mongoose.Types.ObjectId(userId),
      typeId: foodType1._id,
      expirationDate: tomorrow,
      percentLeft: 100,
    });

    await foodItemModel.create({
      userId: new mongoose.Types.ObjectId(userId),
      typeId: foodType2._id,
      expirationDate: tomorrow,
      percentLeft: 50,
    });

    const response = await request(app)
      .post('/api/notifications/check')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.itemsExpiring).toBe(2);
    expect(response.body.notificationSent).toBe(true);

    console.log('[TEST] ✓ Handled multiple expiring items');
  });

  /**
   * Test: No expiring items found
   * Tests notification.ts lines 87-92 (no expiring items path)
   */
  test('should return success when no items are expiring', async () => {
    const foodType = await foodTypeModel.create({
      name: 'Apple',
      nutrients: { calories: '52' },
    });

    // Create item expiring in 10 days (beyond threshold)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    await foodItemModel.create({
      userId: new mongoose.Types.ObjectId(userId),
      typeId: foodType._id,
      expirationDate: futureDate,
      percentLeft: 100,
    });

    const response = await request(app)
      .post('/api/notifications/check')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.message).toBe('No expiring items');
    expect(response.body.itemsExpiring).toBe(0);
    expect(response.body.notificationSent).toBe(false);

    console.log('[TEST] ✓ Handled no expiring items');
  });

  /**
   * Test: No FCM token registered
   * Tests notification.ts lines 26-33
   */
  test('should handle user with no FCM token', async () => {
    // Create a new user without FCM token
    const userNoToken = await userModel.create({
      googleId: 'user-no-token',
      email: 'notoken@example.com',
      name: 'No Token User',
      profilePicture: 'https://example.com/pic.jpg',
      notificationPreferences: {
        enableNotifications: true,
        expiryThresholdDays: 2,
      },
    });

    const newToken = jwt.sign({ id: userNoToken._id.toString() }, process.env.JWT_SECRET!, { expiresIn: '1h' });

    const response = await request(app)
      .post('/api/notifications/check')
      .set('Authorization', `Bearer ${newToken}`)
      .expect(200);

    expect(response.body.message).toBe('No FCM token registered for this user');
    expect(response.body.itemsExpiring).toBe(0);
    expect(response.body.notificationSent).toBe(false);

    console.log('[TEST] ✓ Handled user with no FCM token');
  });

  /**
   * Test: No food items found
   * Tests notification.ts lines 43-49
   */
  test('should handle user with no food items', async () => {
    const response = await request(app)
      .post('/api/notifications/check')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.message).toBe('No food items found');
    expect(response.body.itemsExpiring).toBe(0);
    expect(response.body.notificationSent).toBe(false);

    console.log('[TEST] ✓ Handled user with no food items');
  });

  /**
   * Test: Item without expiration date
   * Tests notification.ts lines 64-66 (checking if expirationDate exists)
   */
  test('should skip items without expiration date', async () => {
    const foodType = await foodTypeModel.create({
      name: 'Pasta',
      nutrients: { calories: '131' },
    });

    // Create item without expiration date
    await foodItemModel.create({
      userId: new mongoose.Types.ObjectId(userId),
      typeId: foodType._id,
      // No expirationDate
      percentLeft: 100,
    });

    const response = await request(app)
      .post('/api/notifications/check')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.itemsExpiring).toBe(0);
    expect(response.body.notificationSent).toBe(false);

    console.log('[TEST] ✓ Skipped items without expiration date');
  });

  /**
   * Test: Notification service fails
   * Tests that endpoint still returns success even if notification fails
   */
  test('should handle notification service failure', async () => {
    jest.spyOn(notificationService, 'sendExpiryNotifications').mockResolvedValueOnce(false);

    const foodType = await foodTypeModel.create({
      name: 'Apple',
      nutrients: { calories: '52' },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await foodItemModel.create({
      userId: new mongoose.Types.ObjectId(userId),
      typeId: foodType._id,
      expirationDate: today,
      percentLeft: 100,
    });

    const response = await request(app)
      .post('/api/notifications/check')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.itemsExpiring).toBe(1);
    expect(response.body.notificationSent).toBe(false);

    console.log('[TEST] ✓ Handled notification service failure');
  });

  /**
   * Test: Custom expiry threshold
   * Tests notification.ts lines 36-38 (using user's custom threshold)
   */
  test('should use custom expiry threshold from user preferences', async () => {
    // Update user with custom threshold of 5 days
    await userModel.update(userId as any, {
      notificationPreferences: {
        enableNotifications: true,
        expiryThresholdDays: 5,
      },
    });

    jest.spyOn(notificationService, 'sendExpiryNotifications').mockResolvedValueOnce(true);

    const foodType = await foodTypeModel.create({
      name: 'Milk',
      nutrients: { calories: '42' },
    });

    // Item expires in 4 days (within 5-day threshold)
    const fourDaysFromNow = new Date();
    fourDaysFromNow.setDate(fourDaysFromNow.getDate() + 4);
    fourDaysFromNow.setHours(0, 0, 0, 0);

    await foodItemModel.create({
      userId: new mongoose.Types.ObjectId(userId),
      typeId: foodType._id,
      expirationDate: fourDaysFromNow,
      percentLeft: 100,
    });

    const response = await request(app)
      .post('/api/notifications/check')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.itemsExpiring).toBe(1);
    expect(response.body.notificationSent).toBe(true);

    console.log('[TEST] ✓ Used custom expiry threshold');
  });

  /**
   * Test: Missing authentication token
   * Tests that auth middleware protects the endpoint
   */
  test('should reject request without authentication', async () => {
    const response = await request(app)
      .post('/api/notifications/check')
      .expect(401);

    expect(response.body.error).toBe('Access denied');

    console.log('[TEST] ✓ Rejected unauthenticated request');
  });

  /**
   * Test: Error during food item fetch
   * Tests notification.ts lines 94-100 (error handling)
   */
  test('should handle error when fetching food items', async () => {
    jest.spyOn(foodItemModel, 'findAllByUserId').mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app)
      .post('/api/notifications/check')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(500);

    expect(response.body.message).toBe('Failed to check notifications');
    expect(response.body.error).toBe('Database error');

    console.log('[TEST] ✓ Handled error when fetching food items');
  });

  /**
   * Test: Error during food type fetch
   * Tests notification.ts lines 94-100 (error handling)
   */
  test('should handle error when fetching food types', async () => {
    const foodType = await foodTypeModel.create({
      name: 'Apple',
      nutrients: { calories: '52' },
    });

    await foodItemModel.create({
      userId: new mongoose.Types.ObjectId(userId),
      typeId: foodType._id,
      expirationDate: new Date(),
      percentLeft: 100,
    });

    jest.spyOn(foodTypeModel, 'findByIds').mockRejectedValueOnce(new Error('Type fetch error'));

    const response = await request(app)
      .post('/api/notifications/check')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(500);

    expect(response.body.message).toBe('Failed to check notifications');

    console.log('[TEST] ✓ Handled error when fetching food types');
  });

  /**
   * Test: Already expired items (edge case)
   * Tests notification.ts lines 64-75 (date comparison logic)
   */
  test('should include already expired items', async () => {
    jest.spyOn(notificationService, 'sendExpiryNotifications').mockResolvedValueOnce(true);

    const foodType = await foodTypeModel.create({
      name: 'Yogurt',
      nutrients: { calories: '59' },
    });

    // Item expired yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    await foodItemModel.create({
      userId: new mongoose.Types.ObjectId(userId),
      typeId: foodType._id,
      expirationDate: yesterday,
      percentLeft: 75,
    });

    const response = await request(app)
      .post('/api/notifications/check')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.itemsExpiring).toBe(1);
    expect(response.body.notificationSent).toBe(true);

    console.log('[TEST] ✓ Included already expired items');
  });

  /**
   * Test: Item expiring exactly on threshold
   * Tests edge case where item expires exactly at threshold date
   */
  test('should include items expiring exactly on threshold', async () => {
    jest.spyOn(notificationService, 'sendExpiryNotifications').mockResolvedValueOnce(true);

    const foodType = await foodTypeModel.create({
      name: 'Bread',
      nutrients: { calories: '265' },
    });

    // Item expires exactly 2 days from now (matching default threshold)
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    twoDaysFromNow.setHours(0, 0, 0, 0);

    await foodItemModel.create({
      userId: new mongoose.Types.ObjectId(userId),
      typeId: foodType._id,
      expirationDate: twoDaysFromNow,
      percentLeft: 100,
    });

    const response = await request(app)
      .post('/api/notifications/check')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.itemsExpiring).toBe(1);

    console.log('[TEST] ✓ Included items expiring exactly on threshold');
  });

  /**
   * Test: User with no notification preferences (uses defaults)
   * Tests notification.ts line 36 (default value || 2)
   */
  test('should use default threshold when user has no preferences', async () => {
    // Create user without notification preferences
    const userNoPrefs = await userModel.create({
      googleId: 'user-no-prefs',
      email: 'noprefs@example.com',
      name: 'No Prefs User',
      profilePicture: 'https://example.com/pic.jpg',
      fcmToken: 'test-fcm-token-2',
    });

    const token = jwt.sign({ id: userNoPrefs._id.toString() }, process.env.JWT_SECRET!, { expiresIn: '1h' });

    jest.spyOn(notificationService, 'sendExpiryNotifications').mockResolvedValueOnce(true);

    const foodType = await foodTypeModel.create({
      name: 'Cheese',
      nutrients: { calories: '402' },
    });

    // Item expires tomorrow (within default 2-day threshold)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    await foodItemModel.create({
      userId: userNoPrefs._id,
      typeId: foodType._id,
      expirationDate: tomorrow,
      percentLeft: 100,
    });

    const response = await request(app)
      .post('/api/notifications/check')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.itemsExpiring).toBe(1);

    console.log('[TEST] ✓ Used default threshold for user without preferences');
  });
});

/**
 * =============================================================================
 * TEST SUITE FOR: POST /api/notifications/admin/test-simple
 * =============================================================================
 */

describe('POST /api/notifications/admin/test-simple - Send Test Notification', () => {
  const app = createTestApp();

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
   * Test: Successfully send test notification
   * Tests notification-admin.ts lines 13-31
   */
  test('should send test notification successfully', async () => {
    jest.spyOn(notificationService, 'sendNotification').mockResolvedValueOnce(true);

    const response = await request(app)
      .post('/api/notifications/admin/test-simple')
      .send({ fcmToken: 'test-fcm-token' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Test notification sent!');

    console.log('[TEST] ✓ Sent test notification successfully');
  });

  /**
   * Test: Missing FCM token
   * Tests notification-admin.ts lines 17-19
   */
  test('should reject request without FCM token', async () => {
    const response = await request(app)
      .post('/api/notifications/admin/test-simple')
      .send({})
      .expect(400);

    expect(response.body.message).toBe('FCM token required in request body');

    console.log('[TEST] ✓ Rejected request without FCM token');
  });

  /**
   * Test: Notification service fails
   * Tests notification-admin.ts lines 21-30 (failure response)
   */
  test('should handle notification service failure', async () => {
    jest.spyOn(notificationService, 'sendNotification').mockResolvedValueOnce(false);

    const response = await request(app)
      .post('/api/notifications/admin/test-simple')
      .send({ fcmToken: 'test-fcm-token' })
      .expect(200);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Failed to send notification');

    console.log('[TEST] ✓ Handled notification service failure');
  });

  /**
   * Test: Error during notification send
   * Tests notification-admin.ts lines 32-38 (error handling)
   */
  test('should handle error during notification send', async () => {
    jest.spyOn(notificationService, 'sendNotification').mockRejectedValueOnce(new Error('Send failed'));

    const response = await request(app)
      .post('/api/notifications/admin/test-simple')
      .send({ fcmToken: 'test-fcm-token' })
      .expect(500);

    expect(response.body.message).toBe('Failed to send test notification');
    expect(response.body.error).toBe('Send failed');

    console.log('[TEST] ✓ Handled error during notification send');
  });
});

console.log('✓ Notification check API tests loaded');

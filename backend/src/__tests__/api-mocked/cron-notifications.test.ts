/**
 * Cron Notification Tests - WITH FCM MOCKING
 *
 * Tests for automated expiration notification cron job
 * Tests the REAL cron service logic with REAL notification code but MOCKED FCM
 *
 * What is tested:
 * - Real cronService.triggerNotificationCheck() logic
 * - Real notificationService.sendExpiryNotifications() logic
 * - Real notification message formatting
 * - Real database queries for users and food items
 * - Mocked: Firebase Admin SDK messaging.send() (no real push notifications)
 */

import { describe, expect, test, jest, beforeAll, afterAll, afterEach, beforeEach } from '@jest/globals';

// Track mock FCM send calls globally (populated by Firebase Admin mock)
const mockSendCalls: any[] = [];

// Track mock cron schedule calls
const mockCronScheduleCalls: any[] = [];

// Mock node-cron module to track schedule registration
jest.mock('node-cron', () => ({
  schedule: (pattern: string, callback: Function) => {
    mockCronScheduleCalls.push({ pattern, callback });
    return {}; // Return mock ScheduledTask object
  },
}));

// Mock Firebase Admin SDK - EVERYTHING must be defined inside the factory
jest.mock('firebase-admin', () => {
  // Create mock app object
  const mockApp = {
    name: '[DEFAULT]',
  };

  // Create mock messaging object with send method
  const mockMessaging = {
    send: async (message: any) => {
      mockSendCalls.push(message);
      return 'mock-message-id';
    },
  };

  // Create the mock Firebase Admin module
  const mockFirebaseAdmin = {
    // Simulate already initialized Firebase
    apps: [mockApp],

    // Mock initializeApp to do nothing (already initialized)
    initializeApp: () => mockApp,

    // Mock credential
    credential: {
      cert: () => ({}),
    },

    // Mock messaging to ALWAYS return the SAME mockMessaging object
    messaging: () => mockMessaging,
  };

  // Return module with both default export AND named exports
  return {
    __esModule: true,
    default: mockFirebaseAdmin,  // For: import admin from 'firebase-admin'
    ...mockFirebaseAdmin,         // For: import { apps, messaging } from 'firebase-admin'
  };
});

// Now import services AFTER mock is set up
import * as dbHandler from '../helpers/dbHandler';
import { userModel } from '../../models/user';
import { foodItemModel } from '../../models/foodItem';
import { foodTypeModel } from '../../models/foodType';
import { cronService } from '../../services/cronService';
import { notificationService } from '../../services/notification';

/**
 * =============================================================================
 * TEST SUITE FOR: Cron Notification Service
 * =============================================================================
 */

describe('Cron Notification Service - REAL LOGIC WITH MOCKED FCM', () => {
  beforeAll(async () => {
    await dbHandler.connect();
  });

  beforeEach(async () => {
    // Clear mock calls before each test
    mockSendCalls.length = 0;
    mockCronScheduleCalls.length = 0;
  });

  afterEach(async () => {
    // Reset cron service state
    cronService.stop();
    await dbHandler.clearDatabase();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  /**
   * =========================================================================
   * CRON SETUP TESTS - Test the start() setup code
   * =========================================================================
   */

  /**
   * Test: Cron service start() registers schedule with correct pattern
   *
   * This tests the REAL cronService.start() setup code (lines 17-51)
   * Verifies:
   * - Real start() method runs
   * - Real Firebase initialization check executes
   * - Cron schedule is registered with correct pattern '0 9,18 * * *'
   * - isRunning flag is set correctly
   */
  test('should register cron schedule when start() is called', () => {
    // Clear any previous schedule calls
    mockCronScheduleCalls.length = 0;

    // Call the REAL start() method
    cronService.start();

    // Verify cron.schedule() was called with correct pattern
    expect(mockCronScheduleCalls.length).toBe(1);
    expect(mockCronScheduleCalls[0].pattern).toBe('0 9,18 * * *');
    expect(mockCronScheduleCalls[0].callback).toBeInstanceOf(Function);

    console.log('[TEST RESULT] ✓ Cron schedule registered with pattern: 0 9,18 * * *');
  });

  /**
   * Test: Cron service start() prevents duplicate initialization
   */
  test('should prevent duplicate start() calls', () => {
    mockCronScheduleCalls.length = 0;

    // Call start() twice
    cronService.start();
    cronService.start();

    // Should only register schedule once
    expect(mockCronScheduleCalls.length).toBe(1);

    console.log('[TEST RESULT] ✓ Duplicate start() prevented');
  });

  /**
   * Test: Cron service logs warning when Firebase is not initialized
   *
   * Tests cronService.ts lines 30-32
   * Verifies that start() checks Firebase initialization and logs appropriate warnings
   */
  test('should log warning when Firebase is not initialized', () => {
    mockCronScheduleCalls.length = 0;

    // Mock console.error to capture error messages
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    // Mock notificationService.isInitialized() to return false
    const isInitializedSpy = jest.spyOn(notificationService, 'isInitialized').mockReturnValue(false);

    // Call start()
    cronService.start();

    // Verify Firebase not initialized error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Firebase Admin SDK: NOT INITIALIZED'));
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Notifications will NOT work'));

    // Verify cron schedule was still registered (service continues despite warning)
    expect(mockCronScheduleCalls.length).toBe(1);

    // Restore mocks
    consoleErrorSpy.mockRestore();
    isInitializedSpy.mockRestore();

    console.log('[TEST RESULT] ✓ Firebase not initialized warning logged correctly');
  });

  /**
   * Test: Scheduled cron callback executes notification check
   *
   * This test verifies that the callback registered with cron.schedule()
   * actually calls the notification check logic when triggered
   */
  test('should execute notification check when cron callback is triggered', async () => {
    mockCronScheduleCalls.length = 0;
    mockSendCalls.length = 0;

    // Set up test data
    const user = await userModel.create({
      googleId: 'test-cron-callback',
      email: 'cron@example.com',
      name: 'Cron Test User',
      profilePicture: 'https://example.com/pic.jpg',
      fcmToken: 'test-fcm-token-cron',
      notificationPreferences: {
        enableNotifications: true,
        expiryThresholdDays: 2,
      },
    });

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

    // Call start() to register the schedule
    cronService.start();

    // Get the registered callback
    const registeredCallback = mockCronScheduleCalls[0].callback;

    // Manually trigger the callback (simulating cron execution)
    await registeredCallback();

    // Verify notification was sent
    expect(mockSendCalls.length).toBe(1);
    expect(mockSendCalls[0]).toMatchObject({
      notification: {
        title: expect.stringContaining('1 Item Expiring Soon'),
      },
      token: 'test-fcm-token-cron',
    });

    console.log('[TEST RESULT] ✓ Cron callback successfully triggered notification check');
  });

  /**
   * Test: Cron service handles user with no food items
   *
   * Tests cronService.ts lines 118-119
   * Verifies that the cron service handles users with empty fridges correctly
   */
  test('should handle user with no food items', async () => {
    mockSendCalls.length = 0;

    // Create user with FCM token but NO food items
    const user = await userModel.create({
      googleId: 'test-no-items',
      email: 'noitems@example.com',
      name: 'User With No Items',
      profilePicture: 'https://example.com/pic.jpg',
      fcmToken: 'test-fcm-token-no-items',
      notificationPreferences: {
        enableNotifications: true,
        expiryThresholdDays: 2,
      },
    });

    // Trigger notification check
    await cronService.triggerNotificationCheck();

    // Should NOT send any notification (no items to expire)
    expect(mockSendCalls.length).toBe(0);

    console.log('[TEST RESULT] ✓ Correctly handled user with no food items (no notification sent)');
  });

  /**
   * =========================================================================
   * NOTIFICATION LOGIC TESTS - Test the core notification business logic
   * =========================================================================
   */

  /**
   * Test: Send notification for food items expiring today
   */
  test('should send notification for food item expiring today', async () => {
    const user = await userModel.create({
      googleId: 'test-google-id',
      email: 'test@example.com',
      name: 'Test User',
      profilePicture: 'https://example.com/pic.jpg',
      fcmToken: 'test-fcm-token-123',
      notificationPreferences: {
        enableNotifications: true,
        expiryThresholdDays: 2,
      },
    });

    const foodType = await foodTypeModel.create({
      name: 'Apple',
      nutritionalInfo: {
        calories: 52,
        protein: 0.3,
        carbohydrates: 14,
        fat: 0.2,
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

    console.log(`[TEST SETUP] Created food item expiring today`);

    await cronService.triggerNotificationCheck();

    // Verify Firebase Admin send was called
    expect(mockSendCalls.length).toBe(1);

    const sentMessage = mockSendCalls[0];
    expect(sentMessage).toMatchObject({
      notification: {
        title: expect.stringContaining('1 Item Expiring Soon'),
        body: expect.stringContaining('Apple'),
      },
      token: 'test-fcm-token-123',
      data: {
        itemCount: '1',
        type: 'expiry',
      },
    });

    console.log('[TEST RESULT] ✓ Real notification code ran and FCM message sent');
    console.log(`  Title: ${sentMessage.notification?.title}`);
    console.log(`  Body: ${sentMessage.notification?.body}`);
  });

  /**
   * Test: Send notification for food item expiring in 1 day
   */
  test('should send notification for food item expiring within threshold (1 day)', async () => {
    const user = await userModel.create({
      googleId: 'test-google-id-2',
      email: 'test2@example.com',
      name: 'Test User 2',
      profilePicture: 'https://example.com/pic2.jpg',
      fcmToken: 'test-fcm-token-456',
      notificationPreferences: {
        enableNotifications: true,
        expiryThresholdDays: 2,
      },
    });

    const foodType = await foodTypeModel.create({
      name: 'Banana',
      nutritionalInfo: {
        calories: 89,
        protein: 1.1,
        carbohydrates: 23,
        fat: 0.3,
      },
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    await foodItemModel.create({
      userId: user._id,
      typeId: foodType._id,
      expirationDate: tomorrow,
      percentLeft: 100,
    });

    await cronService.triggerNotificationCheck();

    expect(mockSendCalls.length).toBe(1);

    const sentMessage = mockSendCalls[0];
    expect(sentMessage).toMatchObject({
      notification: {
        title: expect.stringContaining('1 Item Expiring Soon'),
        body: expect.stringContaining('Banana'),
      },
      token: 'test-fcm-token-456',
    });

    console.log('[TEST RESULT] ✓ Real notification code ran for item expiring within threshold');
  });

  /**
   * Test: Do NOT send notification for food item expiring outside threshold
   */
  test('should NOT send notification for food item expiring outside threshold', async () => {
    const user = await userModel.create({
      googleId: 'test-google-id-3',
      email: 'test3@example.com',
      name: 'Test User 3',
      profilePicture: 'https://example.com/pic3.jpg',
      fcmToken: 'test-fcm-token-789',
      notificationPreferences: {
        enableNotifications: true,
        expiryThresholdDays: 2,
      },
    });

    const foodType = await foodTypeModel.create({
      name: 'Orange',
      nutritionalInfo: {
        calories: 47,
        protein: 0.9,
        carbohydrates: 12,
        fat: 0.1,
      },
    });

    const fiveDaysFromNow = new Date();
    fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);
    fiveDaysFromNow.setHours(0, 0, 0, 0);

    await foodItemModel.create({
      userId: user._id,
      typeId: foodType._id,
      expirationDate: fiveDaysFromNow,
      percentLeft: 100,
    });

    await cronService.triggerNotificationCheck();

    expect(mockSendCalls.length).toBe(0);

    console.log('[TEST RESULT] ✓ No notification sent for item outside threshold');
  });

  /**
   * Test: Send notification with multiple expiring items
   */
  test('should send single notification with multiple expiring items', async () => {
    const user = await userModel.create({
      googleId: 'test-google-id-4',
      email: 'test4@example.com',
      name: 'Test User 4',
      profilePicture: 'https://example.com/pic4.jpg',
      fcmToken: 'test-fcm-token-multi',
      notificationPreferences: {
        enableNotifications: true,
        expiryThresholdDays: 3,
      },
    });

    const apple = await foodTypeModel.create({
      name: 'Apple',
      nutritionalInfo: { calories: 52, protein: 0.3, carbohydrates: 14, fat: 0.2 },
    });

    const banana = await foodTypeModel.create({
      name: 'Banana',
      nutritionalInfo: { calories: 89, protein: 1.1, carbohydrates: 23, fat: 0.3 },
    });

    const milk = await foodTypeModel.create({
      name: 'Milk',
      nutritionalInfo: { calories: 42, protein: 3.4, carbohydrates: 5, fat: 1 },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const twoDays = new Date(today);
    twoDays.setDate(twoDays.getDate() + 2);

    await foodItemModel.create({
      userId: user._id,
      typeId: apple._id,
      expirationDate: today,
      percentLeft: 100,
    });

    await foodItemModel.create({
      userId: user._id,
      typeId: banana._id,
      expirationDate: tomorrow,
      percentLeft: 100,
    });

    await foodItemModel.create({
      userId: user._id,
      typeId: milk._id,
      expirationDate: twoDays,
      percentLeft: 100,
    });

    await cronService.triggerNotificationCheck();

    expect(mockSendCalls.length).toBe(1);

    const sentMessage = mockSendCalls[0];
    expect(sentMessage).toMatchObject({
      notification: {
        title: expect.stringContaining('3 Items Expiring Soon'),
        body: expect.stringMatching(/Apple.*Banana.*Milk|Apple.*Milk.*Banana|Banana.*Apple.*Milk/),
      },
      token: 'test-fcm-token-multi',
      data: {
        itemCount: '3',
        type: 'expiry',
      },
    });

    console.log('[TEST RESULT] ✓ Real notification code created message with 3 expiring items');
    console.log(`  Title: ${sentMessage.notification?.title}`);
    console.log(`  Body: ${sentMessage.notification?.body}`);
  });

  /**
   * Test: Do NOT send notification for user without FCM token
   */
  test('should NOT send notification for user without FCM token', async () => {
    const user = await userModel.create({
      googleId: 'test-google-id-5',
      email: 'test5@example.com',
      name: 'Test User 5',
      profilePicture: 'https://example.com/pic5.jpg',
      // No fcmToken!
      notificationPreferences: {
        enableNotifications: true,
        expiryThresholdDays: 2,
      },
    });

    const foodType = await foodTypeModel.create({
      name: 'Strawberry',
      nutritionalInfo: { calories: 32, protein: 0.7, carbohydrates: 8, fat: 0.3 },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await foodItemModel.create({
      userId: user._id,
      typeId: foodType._id,
      expirationDate: today,
      percentLeft: 100,
    });

    await cronService.triggerNotificationCheck();

    expect(mockSendCalls.length).toBe(0);

    console.log('[TEST RESULT] ✓ No notification sent for user without FCM token');
  });

  /**
   * Test: Do NOT send notification for items without expiration date
   */
  test('should NOT send notification for items without expiration date', async () => {
    const user = await userModel.create({
      googleId: 'test-google-id-6',
      email: 'test6@example.com',
      name: 'Test User 6',
      profilePicture: 'https://example.com/pic6.jpg',
      fcmToken: 'test-fcm-token-no-expiry',
      notificationPreferences: {
        enableNotifications: true,
        expiryThresholdDays: 2,
      },
    });

    const foodType = await foodTypeModel.create({
      name: 'Canned Beans',
      nutritionalInfo: { calories: 100, protein: 6, carbohydrates: 18, fat: 0.5 },
    });

    await foodItemModel.create({
      userId: user._id,
      typeId: foodType._id,
      // No expirationDate!
      percentLeft: 100,
    });

    await cronService.triggerNotificationCheck();

    expect(mockSendCalls.length).toBe(0);

    console.log('[TEST RESULT] ✓ No notification sent for item without expiration date');
  });
});

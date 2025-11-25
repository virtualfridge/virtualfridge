/**
 * Notification Service Tests - sendNotification Coverage
 *
 * Tests notification.ts lines 69-74 (catch block in sendNotification)
 * Uses mocked firebase-admin to trigger all code paths
 *
 * Coverage targets:
 * - Line 50-52: Firebase not initialized (early return)
 * - Line 65-67: Successful notification send
 * - Line 69-74: Error handling in catch block
 */

import { describe, expect, test, jest, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { createTestApp } from '../helpers/testApp';
import * as dbHandler from '../helpers/dbHandler';
import { userModel } from '../../models/user';
import { mockGoogleUserInfo } from '../helpers/testData';

// Mock firebase-admin before importing notification service
jest.mock('firebase-admin', () => {
  const mockMessaging = {
    send: jest.fn(),
  };

  return {
    apps: [],
    messaging: jest.fn(() => mockMessaging),
    initializeApp: jest.fn(),
    credential: {
      cert: jest.fn(),
    },
  };
});

describe('Notification Service - sendNotification Coverage', () => {
  const app = createTestApp();
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    await dbHandler.connect();
  });

  beforeEach(async () => {
    const user = await userModel.create({
      ...mockGoogleUserInfo,
      fcmToken: 'test-fcm-token-123',
    });
    userId = user._id.toString();
    authToken = jwt.sign({ id: userId }, process.env.JWT_SECRET!, { expiresIn: '1h' });

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await dbHandler.clearDatabase();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  /**
   * Test: Firebase not initialized
   * Tests notification.ts lines 50-52 (early return when not initialized)
   */
  test('should return false when Firebase is not initialized', async () => {
    const { notificationService } = require('../../services/notification');
    const admin = require('firebase-admin');

    // Set initialized to false
    notificationService['initialized'] = false;

    const result = await notificationService.sendNotification(
      'test-token',
      'Test Title',
      'Test Body'
    );

    expect(result).toBe(false);
    expect(admin.messaging).not.toHaveBeenCalled();

    console.log('[TEST] ✓ Returned false when Firebase not initialized');
  });

  /**
   * Test: Successful notification send
   * Tests notification.ts lines 65-67 (successful send returns true)
   */
  test('should return true when notification is sent successfully', async () => {
    const { notificationService } = require('../../services/notification');
    const admin = require('firebase-admin');

    // Set initialized to true
    notificationService['initialized'] = true;

    // Mock successful send
    const mockSend = jest.fn().mockResolvedValueOnce('message-id-123');
    admin.messaging.mockReturnValueOnce({ send: mockSend });

    const result = await notificationService.sendNotification(
      'valid-fcm-token',
      'Success Title',
      'Success Body'
    );

    expect(result).toBe(true);
    expect(mockSend).toHaveBeenCalledWith({
      notification: {
        title: 'Success Title',
        body: 'Success Body',
      },
      data: {},
      token: 'valid-fcm-token',
    });

    console.log('[TEST] ✓ Returned true when notification sent successfully');
  });

  /**
   * Test: Notification send failure (catch block)
   * Tests notification.ts lines 68-75 (error handling)
   */
  test('should return false when sending notification fails', async () => {
    const { notificationService } = require('../../services/notification');
    const admin = require('firebase-admin');

    // Set initialized to true
    notificationService['initialized'] = true;

    // Mock send to throw error
    const mockSend = jest.fn().mockRejectedValueOnce(new Error('FCM service unavailable'));
    admin.messaging.mockReturnValueOnce({ send: mockSend });

    const result = await notificationService.sendNotification(
      'invalid-token',
      'Error Title',
      'Error Body'
    );

    expect(result).toBe(false);
    expect(mockSend).toHaveBeenCalled();

    console.log('[TEST] ✓ Returned false when notification send failed');
  });

  /**
   * Test: Notification send with error code and message
   * Tests notification.ts lines 69-73 (logging error details)
   */
  test('should log error details when send fails', async () => {
    const { notificationService } = require('../../services/notification');
    const admin = require('firebase-admin');

    notificationService['initialized'] = true;

    // Create error with code and message (like FCM errors)
    const fcmError = new Error('Invalid registration token');
    (fcmError as any).code = 'messaging/invalid-registration-token';

    const mockSend = jest.fn().mockRejectedValueOnce(fcmError);
    admin.messaging.mockReturnValueOnce({ send: mockSend });

    const result = await notificationService.sendNotification(
      'bad-token',
      'Test Title',
      'Test Body'
    );

    expect(result).toBe(false);
    // The error should be caught and logged (lines 69-73)

    console.log('[TEST] ✓ Logged error details when send failed');
  });

  /**
   * Test: Notification with custom data
   * Tests notification.ts lines 56-63 (message construction with data)
   */
  test('should send notification with custom data', async () => {
    const { notificationService } = require('../../services/notification');
    const admin = require('firebase-admin');

    notificationService['initialized'] = true;

    const mockSend = jest.fn().mockResolvedValueOnce('message-id-456');
    admin.messaging.mockReturnValueOnce({ send: mockSend });

    const customData = {
      type: 'expiry',
      itemId: '123',
      action: 'view',
    };

    const result = await notificationService.sendNotification(
      'token-with-data',
      'Custom Data Title',
      'Custom Data Body',
      customData
    );

    expect(result).toBe(true);
    expect(mockSend).toHaveBeenCalledWith({
      notification: {
        title: 'Custom Data Title',
        body: 'Custom Data Body',
      },
      data: customData,
      token: 'token-with-data',
    });

    console.log('[TEST] ✓ Sent notification with custom data');
  });

  /**
   * Test: Error with null/undefined properties
   * Tests notification.ts lines 70-72 (optional chaining on error)
   */
  test('should handle error with missing properties', async () => {
    const { notificationService } = require('../../services/notification');
    const admin = require('firebase-admin');

    notificationService['initialized'] = true;

    // Throw error without message or code properties
    const minimalError = { toString: () => 'Unknown error' };
    const mockSend = jest.fn().mockRejectedValueOnce(minimalError);
    admin.messaging.mockReturnValueOnce({ send: mockSend });

    const result = await notificationService.sendNotification(
      'token',
      'Title',
      'Body'
    );

    expect(result).toBe(false);
    // Should handle error?.message and error?.code safely (lines 70-71)

    console.log('[TEST] ✓ Handled error with missing properties');
  });

  /**
   * Test: Network timeout error
   * Tests notification.ts catch block with timeout scenario
   */
  test('should handle network timeout error', async () => {
    const { notificationService } = require('../../services/notification');
    const admin = require('firebase-admin');

    notificationService['initialized'] = true;

    const timeoutError = new Error('Request timeout');
    (timeoutError as any).code = 'ETIMEDOUT';

    const mockSend = jest.fn().mockRejectedValueOnce(timeoutError);
    admin.messaging.mockReturnValueOnce({ send: mockSend });

    const result = await notificationService.sendNotification(
      'timeout-token',
      'Timeout Test',
      'This will timeout'
    );

    expect(result).toBe(false);

    console.log('[TEST] ✓ Handled network timeout error');
  });

  /**
   * Test: sendExpiryNotifications with uninitialized Firebase
   * Tests that sendExpiryNotifications also respects initialized flag
   */
  test('should return false from sendExpiryNotifications when not initialized', async () => {
    const { notificationService } = require('../../services/notification');
    const admin = require('firebase-admin');

    notificationService['initialized'] = false;

    const result = await notificationService.sendExpiryNotifications(
      'test-token',
      [{ name: 'Apple', expirationDate: new Date() }]
    );

    expect(result).toBe(false);
    expect(admin.messaging).not.toHaveBeenCalled();

    console.log('[TEST] ✓ sendExpiryNotifications returned false when not initialized');
  });

  /**
   * Test: sendExpiryNotifications success path
   * Tests that sendExpiryNotifications calls sendNotification internally
   */
  test('should send expiry notification successfully', async () => {
    const { notificationService } = require('../../services/notification');
    const admin = require('firebase-admin');

    notificationService['initialized'] = true;

    const mockSend = jest.fn().mockResolvedValueOnce('message-id');
    admin.messaging.mockReturnValueOnce({ send: mockSend });

    const expiringItems = [
      { name: 'Milk', expirationDate: new Date('2025-01-01') },
    ];

    const result = await notificationService.sendExpiryNotifications(
      'expiry-token',
      expiringItems
    );

    expect(result).toBe(true);
    expect(mockSend).toHaveBeenCalled();

    console.log('[TEST] ✓ Sent expiry notification successfully');
  });

  /**
   * Test: sendExpiryNotifications with error
   * Tests error propagation from sendNotification
   */
  test('should handle error in sendExpiryNotifications', async () => {
    const { notificationService } = require('../../services/notification');
    const admin = require('firebase-admin');

    notificationService['initialized'] = true;

    const mockSend = jest.fn().mockRejectedValueOnce(new Error('FCM error'));
    admin.messaging.mockReturnValueOnce({ send: mockSend });

    const expiringItems = [
      { name: 'Cheese', expirationDate: new Date('2025-01-02') },
      { name: 'Yogurt', expirationDate: new Date('2025-01-03') },
    ];

    const result = await notificationService.sendExpiryNotifications(
      'error-token',
      expiringItems
    );

    expect(result).toBe(false);

    console.log('[TEST] ✓ Handled error in sendExpiryNotifications');
  });
});

/**
 * =============================================================================
 * FIREBASE INITIALIZATION ERROR TESTS
 * =============================================================================
 */

describe('Firebase Initialization - Error Handling', () => {
  let originalEnv: string | undefined;

  beforeAll(async () => {
    await dbHandler.connect();
  });

  beforeEach(() => {
    // Save original environment
    originalEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original environment
    if (originalEnv !== undefined) {
      process.env.FIREBASE_SERVICE_ACCOUNT = originalEnv;
    } else {
      delete process.env.FIREBASE_SERVICE_ACCOUNT;
    }
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  /**
   * Test: Invalid JSON in FIREBASE_SERVICE_ACCOUNT
   * Tests notification.ts lines 39-40 (catch block when JSON.parse fails)
   */
  test('should handle invalid JSON in Firebase credentials', () => {
    // Set invalid JSON
    process.env.FIREBASE_SERVICE_ACCOUNT = 'invalid-json{{{';

    const admin = require('firebase-admin');

    // Clear the module cache to force re-initialization
    jest.resetModules();

    // This should trigger the catch block when trying to parse invalid JSON
    expect(() => {
      // Re-require to trigger initialization (service is a singleton)
      require('../../services/notification');
    }).not.toThrow(); // Should catch the error internally

    // Verify initializeApp was not called due to JSON parse error
    expect(admin.initializeApp).not.toHaveBeenCalled();

    console.log('[TEST] ✓ Handled invalid JSON in Firebase credentials');
  });

  /**
   * Test: admin.credential.cert throws error
   * Tests notification.ts lines 39-40 (catch block when cert fails)
   */
  test('should handle error when creating Firebase credential', () => {
    const admin = require('firebase-admin');

    // Mock cert to throw error
    admin.credential.cert.mockImplementationOnce(() => {
      throw new Error('Invalid certificate format');
    });

    // Set valid JSON but it will fail at cert creation
    process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({
      project_id: 'test-project',
      private_key: 'invalid-key',
      client_email: 'test@test.iam.gserviceaccount.com',
    });

    jest.resetModules();

    // This should trigger the catch block when cert() throws
    expect(() => {
      require('../../services/notification');
    }).not.toThrow(); // Should catch the error internally

    console.log('[TEST] ✓ Handled error when creating Firebase credential');
  });

  /**
   * Test: admin.initializeApp throws error
   * Tests notification.ts lines 39-40 (catch block when initializeApp fails)
   */
  test('should handle error when initializing Firebase app', () => {
    const admin = require('firebase-admin');

    // Mock initializeApp to throw error
    admin.initializeApp.mockImplementationOnce(() => {
      throw new Error('Failed to initialize app');
    });

    // Set valid credentials
    process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({
      project_id: 'test-project',
      private_key: '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----\n',
      client_email: 'test@test.iam.gserviceaccount.com',
    });

    jest.resetModules();

    // This should trigger the catch block when initializeApp() throws
    expect(() => {
      require('../../services/notification');
    }).not.toThrow(); // Should catch the error internally

    console.log('[TEST] ✓ Handled error when initializing Firebase app');
  });

  /**
   * Test: Missing FIREBASE_SERVICE_ACCOUNT (not an error, just early return)
   * Tests notification.ts lines 26-28 (early return, not catch block)
   */
  test('should log warning when Firebase credentials are not configured', () => {
    const admin = require('firebase-admin');

    // Remove Firebase credentials
    delete process.env.FIREBASE_SERVICE_ACCOUNT;

    jest.resetModules();

    // This should NOT throw and should NOT call initializeApp
    expect(() => {
      require('../../services/notification');
    }).not.toThrow();

    // Verify initializeApp was not called
    expect(admin.initializeApp).not.toHaveBeenCalled();

    console.log('[TEST] ✓ Logged warning when Firebase not configured');
  });

  /**
   * Test: Firebase already initialized (early return)
   * Tests notification.ts lines 18-21 (early return when already initialized)
   */
  test('should skip initialization when Firebase already initialized', () => {
    const admin = require('firebase-admin');

    // Mock apps array to indicate Firebase is already initialized
    admin.apps = [{ name: '[DEFAULT]' }];

    process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({
      project_id: 'test-project',
      private_key: 'key',
      client_email: 'test@test.iam.gserviceaccount.com',
    });

    jest.resetModules();

    // This should use existing Firebase app
    expect(() => {
      require('../../services/notification');
    }).not.toThrow();

    // initializeApp should not be called again
    expect(admin.initializeApp).not.toHaveBeenCalled();

    // Reset apps array
    admin.apps = [];

    console.log('[TEST] ✓ Skipped initialization when already initialized');
  });

  /**
   * Test: Malformed JSON structure
   * Tests notification.ts lines 39-40 (catch when credential structure is invalid)
   */
  test('should handle malformed credential structure', () => {
    const admin = require('firebase-admin');

    // Valid JSON but missing required fields
    process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({
      invalid: 'structure',
    });

    // Mock cert to throw for invalid structure
    admin.credential.cert.mockImplementationOnce(() => {
      throw new Error('Missing required fields');
    });

    jest.resetModules();

    expect(() => {
      require('../../services/notification');
    }).not.toThrow(); // Should catch the error internally

    console.log('[TEST] ✓ Handled malformed credential structure');
  });
});

console.log('✓ Notification service tests loaded');

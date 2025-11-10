import { describe, expect, test, jest, beforeEach } from '@jest/globals';

// Mock firebase-admin before importing anything
const mockSend = jest.fn();
const mockMessaging = jest.fn(() => ({ send: mockSend }));
const mockCert = jest.fn();
const mockInitializeApp = jest.fn();

jest.mock('firebase-admin', () => ({
  apps: [{ name: 'mock-app' }], // Simulate initialized Firebase
  initializeApp: mockInitializeApp,
  credential: {
    cert: mockCert,
  },
  messaging: mockMessaging,
}));

// Import after mocking
import admin from 'firebase-admin';
import { notificationService } from '../../../services/notification';

const mockedAdmin = admin as jest.Mocked<typeof admin>;

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockReset();
    mockMessaging.mockReturnValue({ send: mockSend });
  });

  // Note: Initialization tests are complex because the service initializes on import
  // In a real scenario, you'd want to refactor the service to make it more testable
  // For now, we'll focus on testing the public methods

  describe('sendNotification', () => {

    test('should send notification successfully', async () => {
      const fcmToken = 'test-fcm-token';
      const title = 'Test Title';
      const body = 'Test Body';
      const data = { key: 'value' };

      mockSend.mockResolvedValue('message-id-123');

      const result = await notificationService.sendNotification(
        fcmToken,
        title,
        body,
        data
      );

      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalledWith({
        notification: { title, body },
        data,
        token: fcmToken,
      });
    });

    test('should send notification without data parameter', async () => {
      const fcmToken = 'test-fcm-token';
      const title = 'Test Title';
      const body = 'Test Body';

      mockSend.mockResolvedValue('message-id-123');

      const result = await notificationService.sendNotification(fcmToken, title, body);

      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalledWith({
        notification: { title, body },
        data: {},
        token: fcmToken,
      });
    });

    // Note: Testing uninitialized state would require refactoring the service
    // to allow dependency injection or resetting the initialized state

    test('should handle send errors gracefully', async () => {
      const fcmToken = 'test-fcm-token';
      const title = 'Test Title';
      const body = 'Test Body';

      mockSend.mockRejectedValue(new Error('Send failed'));

      const result = await notificationService.sendNotification(fcmToken, title, body);

      expect(result).toBe(false);
    });

    test('should handle invalid token errors', async () => {
      const fcmToken = 'invalid-token';
      const title = 'Test Title';
      const body = 'Test Body';

      mockSend.mockRejectedValue(new Error('Invalid registration token'));

      const result = await notificationService.sendNotification(fcmToken, title, body);

      expect(result).toBe(false);
    });
  });

  describe('sendExpiryNotifications', () => {

    test('should send notification for single expiring item', async () => {
      const fcmToken = 'test-fcm-token';
      const expiringItems = [
        {
          name: 'Apple',
          expirationDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
        },
      ];

      mockSend.mockResolvedValue('message-id-123');

      const result = await notificationService.sendExpiryNotifications(
        fcmToken,
        expiringItems
      );

      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalledWith({
        notification: {
          title: '1 Item Expiring Soon!',
          body: expect.stringContaining('Apple expires in'),
        },
        data: {
          itemCount: '1',
          type: 'expiry',
        },
        token: fcmToken,
      });
    });

    test('should send notification for multiple expiring items', async () => {
      const fcmToken = 'test-fcm-token';
      const expiringItems = [
        {
          name: 'Apple',
          expirationDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        },
        {
          name: 'Banana',
          expirationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        },
      ];

      mockSend.mockResolvedValue('message-id-123');

      const result = await notificationService.sendExpiryNotifications(
        fcmToken,
        expiringItems
      );

      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalledWith({
        notification: {
          title: '2 Items Expiring Soon!',
          body: 'Apple, Banana',
        },
        data: {
          itemCount: '2',
          type: 'expiry',
        },
        token: fcmToken,
      });
    });

    test('should send notification for more than 3 items with summary', async () => {
      const fcmToken = 'test-fcm-token';
      const expiringItems = [
        {
          name: 'Apple',
          expirationDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        },
        {
          name: 'Banana',
          expirationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        },
        {
          name: 'Orange',
          expirationDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        },
        {
          name: 'Grape',
          expirationDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        },
        {
          name: 'Melon',
          expirationDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        },
      ];

      mockSend.mockResolvedValue('message-id-123');

      const result = await notificationService.sendExpiryNotifications(
        fcmToken,
        expiringItems
      );

      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalledWith({
        notification: {
          title: '5 Items Expiring Soon!',
          body: 'Apple, Banana, Orange and 2 more',
        },
        data: {
          itemCount: '5',
          type: 'expiry',
        },
        token: fcmToken,
      });
    });

    test('should send success notification when no items are expiring', async () => {
      const fcmToken = 'test-fcm-token';
      const expiringItems: Array<{ name: string; expirationDate: Date }> = [];

      mockSend.mockResolvedValue('message-id-123');

      const result = await notificationService.sendExpiryNotifications(
        fcmToken,
        expiringItems
      );

      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalledWith({
        notification: {
          title: 'No Expiring Items',
          body: 'Great news! You have no items expiring soon.',
        },
        data: {},
        token: fcmToken,
      });
    });

    test('should handle item expiring in 1 day with correct grammar', async () => {
      const fcmToken = 'test-fcm-token';
      const expiringItems = [
        {
          name: 'Milk',
          expirationDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day
        },
      ];

      mockSend.mockResolvedValue('message-id-123');

      const result = await notificationService.sendExpiryNotifications(
        fcmToken,
        expiringItems
      );

      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          notification: expect.objectContaining({
            body: expect.stringMatching(/Milk expires in \d+ day$/), // Should be "day" not "days"
          }),
        })
      );
    });

    test('should handle item expiring in less than 1 day', async () => {
      const fcmToken = 'test-fcm-token';
      const expiringItems = [
        {
          name: 'Yogurt',
          expirationDate: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours
        },
      ];

      mockSend.mockResolvedValue('message-id-123');

      const result = await notificationService.sendExpiryNotifications(
        fcmToken,
        expiringItems
      );

      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalled();
    });

    // Note: Testing uninitialized state would require refactoring the service

    test('should handle send errors gracefully', async () => {
      const fcmToken = 'test-fcm-token';
      const expiringItems = [
        {
          name: 'Apple',
          expirationDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        },
      ];

      mockSend.mockRejectedValue(new Error('Network error'));

      const result = await notificationService.sendExpiryNotifications(
        fcmToken,
        expiringItems
      );

      expect(result).toBe(false);
    });

    test('should use correct singular/plural form for item count in title', async () => {
      const fcmToken = 'test-fcm-token';

      // Test singular
      mockSend.mockResolvedValue('message-id-123');
      await notificationService.sendExpiryNotifications(fcmToken, [
        { name: 'Apple', expirationDate: new Date() },
      ]);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          notification: expect.objectContaining({
            title: '1 Item Expiring Soon!',
          }),
        })
      );

      // Test plural
      mockSend.mockClear();
      await notificationService.sendExpiryNotifications(fcmToken, [
        { name: 'Apple', expirationDate: new Date() },
        { name: 'Banana', expirationDate: new Date() },
      ]);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          notification: expect.objectContaining({
            title: '2 Items Expiring Soon!',
          }),
        })
      );
    });
  });
});

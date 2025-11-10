import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { NotificationController } from '../../../controllers/notification';
import { notificationService } from '../../../services/notification';
import { foodItemModel } from '../../../models/foodItem';
import { foodTypeModel } from '../../../models/foodType';

// Mock dependencies
jest.mock('../../../services/notification');
jest.mock('../../../models/foodItem');
jest.mock('../../../models/foodType');
jest.mock('../../../util/logger');

const mockedNotificationService = notificationService as jest.Mocked<typeof notificationService>;
const mockedFoodItemModel = foodItemModel as jest.Mocked<typeof foodItemModel>;
const mockedFoodTypeModel = foodTypeModel as jest.Mocked<typeof foodTypeModel>;

describe('NotificationController Unit Tests', () => {
  let controller: NotificationController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  const mockUserId = new mongoose.Types.ObjectId();
  const mockFoodTypeId = new mongoose.Types.ObjectId();
  const mockFoodItemId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new NotificationController();

    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
    mockNext = jest.fn();
  });

  describe('sendTestNotification', () => {
    test('should return 400 when user has no FCM token', async () => {
      mockRequest = {
        user: {
          _id: mockUserId,
          email: 'test@example.com',
          name: 'Test User',
          // No fcmToken
        },
      } as any;

      await controller.sendTestNotification(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'No FCM token registered for this user. Please register your device first.',
      });
    });

    test('should return 200 when user has no food items', async () => {
      mockRequest = {
        user: {
          _id: mockUserId,
          email: 'test@example.com',
          name: 'Test User',
          fcmToken: 'test-fcm-token',
        },
      } as any;

      mockedFoodItemModel.findAllByUserId = jest.fn().mockResolvedValue([]);

      await controller.sendTestNotification(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'No food items found in your fridge',
      });
    });

    test('should return 200 when user has null food items', async () => {
      mockRequest = {
        user: {
          _id: mockUserId,
          email: 'test@example.com',
          name: 'Test User',
          fcmToken: 'test-fcm-token',
        },
      } as any;

      mockedFoodItemModel.findAllByUserId = jest.fn().mockResolvedValue(null);

      await controller.sendTestNotification(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'No food items found in your fridge',
      });
    });

    test('should send notification for expiring items', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      mockRequest = {
        user: {
          _id: mockUserId,
          email: 'test@example.com',
          name: 'Test User',
          fcmToken: 'test-fcm-token',
          notificationPreferences: {
            expiryThresholdDays: 2,
          },
        },
      } as any;

      const mockFoodItem = {
        _id: mockFoodItemId,
        userId: mockUserId,
        typeId: mockFoodTypeId,
        expirationDate: tomorrow,
        percentLeft: 100,
      };

      const mockFoodType = {
        _id: mockFoodTypeId,
        name: 'Apple',
        shelfLifeDays: 7,
      };

      mockedFoodItemModel.findAllByUserId = jest.fn().mockResolvedValue([mockFoodItem]);
      mockedFoodTypeModel.findById = jest.fn().mockResolvedValue(mockFoodType);
      mockedNotificationService.sendExpiryNotifications = jest.fn().mockResolvedValue(true);

      await controller.sendTestNotification(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Test notification sent successfully',
        data: {
          expiringItemsCount: 1,
          expiringItems: expect.arrayContaining([
            expect.objectContaining({
              name: 'Apple',
            }),
          ]),
        },
      });
      expect(mockedNotificationService.sendExpiryNotifications).toHaveBeenCalledWith(
        'test-fcm-token',
        expect.any(Array)
      );
    });

    test('should use default expiry threshold when not set', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      mockRequest = {
        user: {
          _id: mockUserId,
          email: 'test@example.com',
          name: 'Test User',
          fcmToken: 'test-fcm-token',
          // No notificationPreferences
        },
      } as any;

      const mockFoodItem = {
        _id: mockFoodItemId,
        userId: mockUserId,
        typeId: mockFoodTypeId,
        expirationDate: tomorrow,
        percentLeft: 100,
      };

      const mockFoodType = {
        _id: mockFoodTypeId,
        name: 'Banana',
        shelfLifeDays: 5,
      };

      mockedFoodItemModel.findAllByUserId = jest.fn().mockResolvedValue([mockFoodItem]);
      mockedFoodTypeModel.findById = jest.fn().mockResolvedValue(mockFoodType);
      mockedNotificationService.sendExpiryNotifications = jest.fn().mockResolvedValue(true);

      await controller.sendTestNotification(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      // Should use default threshold of 2 days
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test notification sent successfully',
        })
      );
    });

    test('should not include items without expiration date', async () => {
      mockRequest = {
        user: {
          _id: mockUserId,
          email: 'test@example.com',
          name: 'Test User',
          fcmToken: 'test-fcm-token',
          notificationPreferences: {
            expiryThresholdDays: 2,
          },
        },
      } as any;

      const mockFoodItem = {
        _id: mockFoodItemId,
        userId: mockUserId,
        typeId: mockFoodTypeId,
        expirationDate: null, // No expiration date
        percentLeft: 100,
      };

      mockedFoodItemModel.findAllByUserId = jest.fn().mockResolvedValue([mockFoodItem]);
      mockedNotificationService.sendExpiryNotifications = jest.fn().mockResolvedValue(true);

      await controller.sendTestNotification(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Test notification sent successfully',
        data: {
          expiringItemsCount: 0,
          expiringItems: [],
        },
      });
    });

    test('should not include items expiring beyond threshold', async () => {
      const farFuture = new Date();
      farFuture.setDate(farFuture.getDate() + 30); // 30 days from now

      mockRequest = {
        user: {
          _id: mockUserId,
          email: 'test@example.com',
          name: 'Test User',
          fcmToken: 'test-fcm-token',
          notificationPreferences: {
            expiryThresholdDays: 2,
          },
        },
      } as any;

      const mockFoodItem = {
        _id: mockFoodItemId,
        userId: mockUserId,
        typeId: mockFoodTypeId,
        expirationDate: farFuture,
        percentLeft: 100,
      };

      mockedFoodItemModel.findAllByUserId = jest.fn().mockResolvedValue([mockFoodItem]);
      mockedNotificationService.sendExpiryNotifications = jest.fn().mockResolvedValue(true);

      await controller.sendTestNotification(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Test notification sent successfully',
        data: {
          expiringItemsCount: 0,
          expiringItems: [],
        },
      });
    });

    test('should skip items where food type is not found', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      mockRequest = {
        user: {
          _id: mockUserId,
          email: 'test@example.com',
          name: 'Test User',
          fcmToken: 'test-fcm-token',
          notificationPreferences: {
            expiryThresholdDays: 2,
          },
        },
      } as any;

      const mockFoodItem = {
        _id: mockFoodItemId,
        userId: mockUserId,
        typeId: mockFoodTypeId,
        expirationDate: tomorrow,
        percentLeft: 100,
      };

      mockedFoodItemModel.findAllByUserId = jest.fn().mockResolvedValue([mockFoodItem]);
      mockedFoodTypeModel.findById = jest.fn().mockResolvedValue(null); // Food type not found
      mockedNotificationService.sendExpiryNotifications = jest.fn().mockResolvedValue(true);

      await controller.sendTestNotification(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Test notification sent successfully',
        data: {
          expiringItemsCount: 0,
          expiringItems: [],
        },
      });
    });

    test('should handle multiple expiring items', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      mockRequest = {
        user: {
          _id: mockUserId,
          email: 'test@example.com',
          name: 'Test User',
          fcmToken: 'test-fcm-token',
          notificationPreferences: {
            expiryThresholdDays: 3,
          },
        },
      } as any;

      const mockFoodType1Id = new mongoose.Types.ObjectId();
      const mockFoodType2Id = new mongoose.Types.ObjectId();

      const mockFoodItems = [
        {
          _id: new mongoose.Types.ObjectId(),
          userId: mockUserId,
          typeId: mockFoodType1Id,
          expirationDate: tomorrow,
          percentLeft: 100,
        },
        {
          _id: new mongoose.Types.ObjectId(),
          userId: mockUserId,
          typeId: mockFoodType2Id,
          expirationDate: tomorrow,
          percentLeft: 50,
        },
      ];

      mockedFoodItemModel.findAllByUserId = jest.fn().mockResolvedValue(mockFoodItems);
      mockedFoodTypeModel.findById = jest
        .fn()
        .mockResolvedValueOnce({ _id: mockFoodType1Id, name: 'Apple' })
        .mockResolvedValueOnce({ _id: mockFoodType2Id, name: 'Banana' });
      mockedNotificationService.sendExpiryNotifications = jest.fn().mockResolvedValue(true);

      await controller.sendTestNotification(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Test notification sent successfully',
        data: {
          expiringItemsCount: 2,
          expiringItems: expect.arrayContaining([
            expect.objectContaining({ name: 'Apple' }),
            expect.objectContaining({ name: 'Banana' }),
          ]),
        },
      });
    });

    test('should return 500 when notification send fails', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      mockRequest = {
        user: {
          _id: mockUserId,
          email: 'test@example.com',
          name: 'Test User',
          fcmToken: 'test-fcm-token',
          notificationPreferences: {
            expiryThresholdDays: 2,
          },
        },
      } as any;

      const mockFoodItem = {
        _id: mockFoodItemId,
        userId: mockUserId,
        typeId: mockFoodTypeId,
        expirationDate: tomorrow,
        percentLeft: 100,
      };

      const mockFoodType = {
        _id: mockFoodTypeId,
        name: 'Orange',
        shelfLifeDays: 14,
      };

      mockedFoodItemModel.findAllByUserId = jest.fn().mockResolvedValue([mockFoodItem]);
      mockedFoodTypeModel.findById = jest.fn().mockResolvedValue(mockFoodType);
      mockedNotificationService.sendExpiryNotifications = jest.fn().mockResolvedValue(false);

      await controller.sendTestNotification(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Failed to send notification',
      });
    });

    test('should handle Error instances during processing', async () => {
      mockRequest = {
        user: {
          _id: mockUserId,
          email: 'test@example.com',
          name: 'Test User',
          fcmToken: 'test-fcm-token',
        },
      } as any;

      const error = new Error('Database connection failed');
      mockedFoodItemModel.findAllByUserId = jest.fn().mockRejectedValue(error);

      await controller.sendTestNotification(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Database connection failed',
      });
    });

    test('should call next for non-Error exceptions', async () => {
      mockRequest = {
        user: {
          _id: mockUserId,
          email: 'test@example.com',
          name: 'Test User',
          fcmToken: 'test-fcm-token',
        },
      } as any;

      const genericError = { code: 'UNKNOWN' };
      mockedFoodItemModel.findAllByUserId = jest.fn().mockRejectedValue(genericError);

      await controller.sendTestNotification(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(genericError);
    });

    test('should handle Error with no message', async () => {
      mockRequest = {
        user: {
          _id: mockUserId,
          email: 'test@example.com',
          name: 'Test User',
          fcmToken: 'test-fcm-token',
        },
      } as any;

      const error = new Error();
      mockedFoodItemModel.findAllByUserId = jest.fn().mockRejectedValue(error);

      await controller.sendTestNotification(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Failed to send test notification',
      });
    });
  });
});

import { describe, expect, test, jest, beforeAll, afterAll, afterEach } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { createTestApp } from '../helpers/testApp';
import * as dbHandler from '../helpers/dbHandler';
import { userModel } from '../../models/user';
import { foodTypeModel } from '../../models/foodType';
import { foodItemModel } from '../../models/foodItem';
import { mockGoogleUserInfo, mockFoodType, mockFoodItem } from '../helpers/testData';
import { notificationService } from '../../services/notification';

// Mock the notification service
jest.mock('../../services/notification', () => ({
  notificationService: {
    sendExpiryNotifications: jest.fn(),
  },
}));

describe('Notification Controller Integration Tests', () => {
  const app = createTestApp();
  let authToken: string;
  let userId: string;
  let foodTypeId: string;

  beforeAll(async () => {
    await dbHandler.connect();
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    // Create the test user with FCM token before each test
    const user = await userModel.create({
      ...mockGoogleUserInfo,
      fcmToken: 'test-fcm-token',
      notificationPreferences: {
        enableNotifications: true,
        expiryThresholdDays: 2,
      },
    } as any);
    userId = user._id.toString();
    authToken = jwt.sign({ id: userId }, process.env.JWT_SECRET!, { expiresIn: '1h' });

    // Create a test food type
    const foodType = await foodTypeModel.create(mockFoodType);
    foodTypeId = foodType._id.toString();
  });

  afterEach(async () => {
    await dbHandler.clearDatabase();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  describe('POST /api/notifications/test', () => {
    test('should send test notification for expiring items', async () => {
      // Create an expiring food item
      await foodItemModel.create({
        userId: new mongoose.Types.ObjectId(userId),
        typeId: new mongoose.Types.ObjectId(foodTypeId),
        expirationDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
        percentLeft: 100,
      });

      // Mock successful notification send
      (notificationService.sendExpiryNotifications as any).mockResolvedValue(true);

      const response = await request(app)
        .post('/api/notifications/test')
        .set('Authorization', `Bearer ${authToken}`);

      // Debug: log the response if it's not 200
      if (response.status !== 200) {
        console.log('Status:', response.status);
        console.log('Body:', response.body);
      }

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('expiringItemsCount');
      expect(response.body.data.expiringItemsCount).toBeGreaterThan(0);
      expect(notificationService.sendExpiryNotifications).toHaveBeenCalled();
    });

    test('should return 400 when user has no FCM token', async () => {
      // Update user to remove FCM token
      await userModel.update(new mongoose.Types.ObjectId(userId), { fcmToken: undefined });

      // Create new token for updated user
      const updatedUser = await userModel.findById(new mongoose.Types.ObjectId(userId));
      const newToken = jwt.sign({ id: updatedUser!._id.toString() }, process.env.JWT_SECRET!, { expiresIn: '1h' });

      const response = await request(app)
        .post('/api/notifications/test')
        .set('Authorization', `Bearer ${newToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('FCM token');
    });

    test('should return 200 when user has no food items', async () => {
      const response = await request(app)
        .post('/api/notifications/test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('No food items');
    });

    test('should return 500 when notification send fails', async () => {
      // Create an expiring food item
      await foodItemModel.create({
        userId: new mongoose.Types.ObjectId(userId),
        typeId: new mongoose.Types.ObjectId(foodTypeId),
        expirationDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        percentLeft: 100,
      });

      // Mock failed notification send
      (notificationService.sendExpiryNotifications as any).mockResolvedValue(false);

      const response = await request(app)
        .post('/api/notifications/test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Failed to send notification');
    });

    test('should not include non-expiring items', async () => {
      // Create a non-expiring food item (far in the future)
      await foodItemModel.create({
        userId: new mongoose.Types.ObjectId(userId),
        typeId: new mongoose.Types.ObjectId(foodTypeId),
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        percentLeft: 100,
      });

      (notificationService.sendExpiryNotifications as any).mockResolvedValue(true);

      const response = await request(app)
        .post('/api/notifications/test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Should not find expiring items
      expect(response.body.data.expiringItemsCount).toBe(0);
    });

    test('should return 401 without authentication token', async () => {
      await request(app)
        .post('/api/notifications/test')
        .expect(401);
    });

    test('should handle Error exceptions during notification processing', async () => {
      // Create an expiring food item
      await foodItemModel.create({
        userId: new mongoose.Types.ObjectId(userId),
        typeId: new mongoose.Types.ObjectId(foodTypeId),
        expirationDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        percentLeft: 100,
      });

      // Mock foodItemModel.findAllByUserId to throw Error
      jest.spyOn(foodItemModel, 'findAllByUserId').mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .post('/api/notifications/test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Database connection failed');
    });

    test('should handle non-Error exceptions during notification processing', async () => {
      // Mock foodItemModel.findAllByUserId to throw non-Error
      jest.spyOn(foodItemModel, 'findAllByUserId').mockRejectedValueOnce('string error');

      await request(app)
        .post('/api/notifications/test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);
    });
  });
});

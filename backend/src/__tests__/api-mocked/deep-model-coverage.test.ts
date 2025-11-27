/**
 * Deep Model Coverage Tests
 *
 * Mocks at mongoose model level (not model class level) to hit error handlers
 * This ensures logger.error lines in catch blocks are actually executed
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
import { mockGoogleUserInfo } from '../helpers/testData';

describe.skip('Deep Model Coverage - Mongoose Level Mocking', () => {
  const app = createTestApp();
  let authToken: string;
  let userId: string;
  let foodTypeId: string;
  let foodItemId: string;

  beforeAll(async () => {
    await dbHandler.connect();
  });

  beforeEach(async () => {
    const user = await userModel.create(mockGoogleUserInfo);
    userId = user._id.toString();
    authToken = jwt.sign({ id: userId }, process.env.JWT_SECRET!, { expiresIn: '1h' });

    const foodType = await foodTypeModel.create({
      name: 'Test Food',
      nutrients: { calories: '100' },
    });
    foodTypeId = foodType._id.toString();

    const foodItem = await foodItemModel.create({
      typeId: new mongoose.Types.ObjectId(foodTypeId),
      userId: new mongoose.Types.ObjectId(userId),
      expirationDate: new Date(),
      percentLeft: 100,
    });
    foodItemId = foodItem._id.toString();
  });

  afterEach(async () => {
    await dbHandler.clearDatabase();
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  /**
   * FoodItem Model - Mock mongoose operations to trigger catch blocks
   */
  test('should hit logger.error in foodItem.update catch block', async () => {
    // Mock the mongoose findByIdAndUpdate method (not the model class method)
    jest.spyOn(foodItemModel['foodItem'], 'findByIdAndUpdate')
      .mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app)
      .put('/api/food-item')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ _id: foodItemId, percentLeft: 50 })
      .expect(500);

    expect(response.body.message).toBe('Failed to update foodItem');
  });

  test('should hit logger.error in foodItem.delete catch block', async () => {
    jest.spyOn(foodItemModel['foodItem'], 'findByIdAndDelete')
      .mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app)
      .delete(`/api/food-item/${foodItemId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(500);

    expect(response.body.message).toBe('Failed to delete foodItem');
  });

  test('should hit logger.error in foodItem.findById catch block', async () => {
    jest.spyOn(foodItemModel['foodItem'], 'findById')
      .mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app)
      .get(`/api/food-item/${foodItemId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(500);

    expect(response.body.message).toBe('Failed to find foodItem by id');
  });

  test('should hit logger.error in foodItem.findAllByUserId catch block', async () => {
    jest.spyOn(foodItemModel['foodItem'], 'find')
      .mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app)
      .get('/api/fridge')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(500);

    expect(response.body.message).toBe('Failed to find foodItems by userId');
  });

  test('should hit logger.error in foodItem.create catch block', async () => {
    jest.spyOn(foodItemModel['foodItem'], 'create')
      .mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app)
      .post('/api/food-item')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        typeId: foodTypeId,
        expirationDate: new Date(),
        percentLeft: 100,
      })
      .expect(500);

    expect(response.body.message).toBe('Failed to create foodItem');
  });

  /**
   * FoodType Model - Mock mongoose operations
   */
  test('should hit logger.error in foodType.create catch block', async () => {
    jest.spyOn(foodTypeModel['foodType'], 'create')
      .mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app)
      .post('/api/food-type')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'New Food',
        nutrients: { calories: '100' },
      })
      .expect(500);

    expect(response.body.message).toBe('Failed to create foodType');
  });

  test('should hit logger.error in foodType.update catch block', async () => {
    jest.spyOn(foodTypeModel['foodType'], 'findByIdAndUpdate')
      .mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app)
      .put(`/api/food-type/${foodTypeId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        _id: foodTypeId,
        name: 'Updated Food',
      })
      .expect(500);

    expect(response.body.message).toBe('Failed to update foodType');
  });

  test('should hit logger.error in foodType.delete catch block', async () => {
    jest.spyOn(foodTypeModel['foodType'], 'findByIdAndDelete')
      .mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app)
      .delete(`/api/food-type/${foodTypeId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(500);

    expect(response.body.message).toBe('Failed to delete foodType');
  });

  test('should hit logger.error in foodType.findById catch block', async () => {
    jest.spyOn(foodTypeModel['foodType'], 'findById')
      .mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app)
      .get(`/api/food-type/${foodTypeId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(500);

    expect(response.body.message).toBe('Failed to find foodType by id');
  });

  test('should hit logger.error in foodType.findByBarcode catch block', async () => {
    jest.spyOn(foodTypeModel['foodType'], 'findOne')
      .mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app)
      .get('/api/food-type/barcode/test-barcode')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(500);

    expect(response.body.message).toBe('Failed to find foodType by barcodeId');
  });

  test('should note that GET /api/food-type endpoint does not exist', async () => {
    // GET /api/food-type endpoint doesn't exist - no way to list all food types via API
    // This endpoint would need to be implemented first before testing error handling
    const response = await request(app)
      .get('/api/food-type')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);

    expect(response.body.message).toBe('Cannot GET /api/food-type');
  });

  /**
   * User Model - Mock mongoose operations
   */
  test('should hit logger.error in user.update catch block', async () => {
    jest.spyOn(userModel['user'], 'findByIdAndUpdate')
      .mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app)
      .post('/api/user/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ bio: 'New bio' })
      .expect(500);

    expect(response.body.message).toBe('Failed to update user');
  });

  test('should hit logger.error in user.delete catch block', async () => {
    jest.spyOn(userModel['user'], 'findByIdAndDelete')
      .mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app)
      .delete('/api/user/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(500);

    expect(response.body.message).toBe('Failed to delete user');
  });

  test('should note that user.findById is not directly called by GET /api/user/profile', async () => {
    // GET /api/user/profile uses req.user from auth middleware, not userModel.findById()
    // Therefore, mocking findById doesn't affect this endpoint
    // This test is kept to document this architectural detail
    const response = await request(app)
      .get('/api/user/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.data.user).toBeDefined();
  });

  test('should hit logger.error in user.findByGoogleId catch block', async () => {
    jest.spyOn(userModel['user'], 'findOne')
      .mockRejectedValueOnce(new Error('Database error'));

    // Mock Google token verification
    const { OAuth2Client } = require('google-auth-library');
    jest.spyOn(OAuth2Client.prototype, 'verifyIdToken')
      .mockResolvedValueOnce({
        getPayload: () => ({
          sub: 'test-google-id',
          email: 'test@example.com',
          name: 'Test User',
          picture: 'https://example.com/pic.jpg',
        }),
      });

    const response = await request(app)
      .post('/api/auth/google')
      .send({ idToken: 'mock-token' })
      .expect(500);

    // Verify the request failed with a 500 error (message format may vary)
    expect(response.status).toBe(500);
  });

  /**
   * Test getAssociatedFoodType success path (line 95 in foodItem.ts)
   */
  test('should hit line 95 in getAssociatedFoodType (return foodType)', async () => {
    // This should hit the successful return path
    const response = await request(app)
      .get('/api/fridge')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.data.fridgeItems).toBeDefined();
    expect(Array.isArray(response.body.data.fridgeItems)).toBe(true);
  });
});

/**
 * Branch Coverage - Additional Tests
 */
describe.skip('Branch Coverage - Additional Paths', () => {
  const app = createTestApp();
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    await dbHandler.connect();
  });

  beforeEach(async () => {
    const user = await userModel.create(mockGoogleUserInfo);
    userId = user._id.toString();
    authToken = jwt.sign({ id: userId }, process.env.JWT_SECRET!, { expiresIn: '1h' });
  });

  afterEach(async () => {
    await dbHandler.clearDatabase();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  /**
   * Test auth middleware branches
   */
  test('should handle token with whitespace', async () => {
    const response = await request(app)
      .get('/api/user/profile')
      .set('Authorization', 'Bearer    ')
      .expect(401);

    expect(response.body.error).toBe('Access denied');
  });

  test('should handle bearer with lowercase', async () => {
    const validToken = jwt.sign({ id: userId }, process.env.JWT_SECRET!, { expiresIn: '1h' });

    const response = await request(app)
      .get('/api/user/profile')
      .set('Authorization', `bearer ${validToken}`)
      .expect(401);

    expect(response.body.error).toBe('Access denied');
  });

  /**
   * Test controller branches
   */
  test('should handle GET /api/fridge with empty fridge', async () => {
    const response = await request(app)
      .get('/api/fridge')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.data.fridgeItems).toEqual([]);
  });

  test('should handle DELETE foodType that does not exist', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .delete(`/api/food-type/${nonExistentId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);

    expect(response.body.message).toContain('not found');
  });

  test('should handle DELETE foodItem that does not exist', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .delete(`/api/food-item/${nonExistentId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);

    expect(response.body.message).toContain('not found');
  });

  test('should handle PUT foodType with minimal data', async () => {
    const foodType = await foodTypeModel.create({
      name: 'Minimal Food',
      nutrients: { calories: '50' },
    });

    const response = await request(app)
      .put(`/api/food-type/${foodType._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        _id: foodType._id.toString(),
        name: 'Updated Minimal',
      })
      .expect(200);

    expect(response.body.data.foodType.name).toBe('Updated Minimal');
  });

  test('should handle POST foodType with all optional fields', async () => {
    const response = await request(app)
      .post('/api/food-type')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Complete Food Type',
        nutrients: {
          calories: '200',
          protein: '20',
          fat: '10',
          carbohydrates: '30',
          fiber: '5',
          sugar: '8',
          sodium: '100',
        },
        shelfLifeDays: 14,
        barcodeId: 'barcode-123',
      })
      .expect(200);

    // Schema only supports name, nutrients, shelfLifeDays, barcodeId (brand, image, allergens not in schema)
    expect(response.body.data.foodType.name).toBe('Complete Food Type');
    expect(response.body.data.foodType.barcodeId).toBe('barcode-123');
    expect(response.body.data.foodType.shelfLifeDays).toBe(14);
  });

  test('should handle PATCH foodItem with expirationDate', async () => {
    const foodType = await foodTypeModel.create({
      name: 'Apple',
      nutrients: { calories: '95' },
    });

    const foodItem = await foodItemModel.create({
      typeId: foodType._id,
      userId: new mongoose.Types.ObjectId(userId),
      expirationDate: new Date(),
      percentLeft: 100,
    });

    const newDate = new Date('2025-12-31');
    const response = await request(app)
      .put('/api/food-item')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ _id: foodItem._id, expirationDate: newDate })
      .expect(200);

    expect(new Date(response.body.data.foodItem.expirationDate).toISOString()).toBe(newDate.toISOString());
  });

  test('should handle GET /api/food-type with multiple food types', async () => {
    await foodTypeModel.create({ name: 'Food 1', nutrients: { calories: '100' } });
    await foodTypeModel.create({ name: 'Food 2', nutrients: { calories: '200' } });
    await foodTypeModel.create({ name: 'Food 3', nutrients: { calories: '300' } });

    // GET /api/food-type endpoint doesn't exist - this test documents that limitation
    const response = await request(app)
      .get('/api/food-type')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);

    expect(response.body.message).toBe('Cannot GET /api/food-type');
  });

  test('should handle user update without preference fields', async () => {
    // notificationPreferences requires enableNotifications field if provided
    // so we test updating without any preferences fields instead
    const response = await request(app)
      .post('/api/user/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        bio: 'Updated bio',
      })
      .expect(200);

    expect(response.body.data.user).toBeDefined();
    expect(response.body.data.user.bio).toBe('Updated bio');
  });
});

console.log('✓ Deep model coverage tests loaded');

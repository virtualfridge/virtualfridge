import { describe, expect, test, beforeAll, afterAll, afterEach } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createTestApp } from '../helpers/testApp';
import * as dbHandler from '../helpers/dbHandler';
import { userModel } from '../../models/user';
import { foodTypeModel } from '../../models/foodType';
import { mockGoogleUserInfo, mockFoodType } from '../helpers/testData';

describe('FoodType Controller Integration Tests', () => {
  const app = createTestApp();
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    await dbHandler.connect();

    // Create a test user and generate auth token
    const user = await userModel.create(mockGoogleUserInfo);
    userId = user._id.toString();
    authToken = jwt.sign({ id: userId }, process.env.JWT_SECRET!, { expiresIn: '1h' });
  });

  afterEach(async () => {
    await dbHandler.clearDatabase();
    // Recreate the test user and regenerate token after clearing database
    const user = await userModel.create(mockGoogleUserInfo);
    userId = user._id.toString();
    authToken = jwt.sign({ id: userId }, process.env.JWT_SECRET!, { expiresIn: '1h' });
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  describe('POST /api/food-type', () => {
    test('should create food type with authentication', async () => {
      const response = await request(app)
        .post('/api/food-type')
        .set('Authorization', `Bearer ${authToken}`)
        .send(mockFoodType)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.name).toBe(mockFoodType.name);
      expect(response.body.barcodeId).toBe(mockFoodType.barcodeId);
      expect(response.body.shelfLifeDays).toBe(mockFoodType.shelfLifeDays);
    });

    test('should return 401 without authentication token', async () => {
      await request(app)
        .post('/api/food-type')
        .send(mockFoodType)
        .expect(401);
    });

    test('should return 401 with invalid token', async () => {
      await request(app)
        .post('/api/food-type')
        .set('Authorization', 'Bearer invalid-token')
        .send(mockFoodType)
        .expect(401);
    });
  });

  describe('GET /api/food-type/:id', () => {
    test('should get food type by id', async () => {
      const created = await foodTypeModel.create(mockFoodType);

      const response = await request(app)
        .get(`/api/food-type/${created._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body._id).toBe(created._id.toString());
      expect(response.body.name).toBe(mockFoodType.name);
    });

    test('should return 404 for non-existent id', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      await request(app)
        .get(`/api/food-type/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('GET /api/food-type/barcode/:barcodeId', () => {
    test('should get food type by barcode', async () => {
      await foodTypeModel.create(mockFoodType);

      const response = await request(app)
        .get(`/api/food-type/barcode/${mockFoodType.barcodeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.barcodeId).toBe(mockFoodType.barcodeId);
      expect(response.body.name).toBe(mockFoodType.name);
    });

    test('should return 404 for non-existent barcode', async () => {
      await request(app)
        .get('/api/food-type/barcode/999999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PATCH /api/food-type/:id', () => {
    test('should update food type', async () => {
      const created = await foodTypeModel.create(mockFoodType);
      const updates = {
        name: 'Updated Apple',
        shelfLifeDays: 30,
      };

      const response = await request(app)
        .patch(`/api/food-type/${created._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.name).toBe(updates.name);
      expect(response.body.shelfLifeDays).toBe(updates.shelfLifeDays);
    });
  });

  describe('DELETE /api/food-type/:id', () => {
    test('should delete food type', async () => {
      const created = await foodTypeModel.create(mockFoodType);

      await request(app)
        .delete(`/api/food-type/${created._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify deletion
      const found = await foodTypeModel.findById(created._id);
      expect(found).toBeNull();
    });
  });
});

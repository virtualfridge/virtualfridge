import { describe, expect, test, beforeAll, afterAll, afterEach } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { createTestApp } from '../helpers/testApp';
import * as dbHandler from '../helpers/dbHandler';
import { userModel } from '../../models/user';
import { foodTypeModel } from '../../models/foodType';
import { foodItemModel } from '../../models/foodItem';
import { mockGoogleUserInfo, mockFoodType, mockFoodItem } from '../helpers/testData';

describe('FoodItem Controller Integration Tests', () => {
  const app = createTestApp();
  let authToken: string;
  let userId: string;
  let foodTypeId: string;

  beforeAll(async () => {
    await dbHandler.connect();
  });

  beforeEach(async () => {
    // Create test user and food type before each test
    const user = await userModel.create(mockGoogleUserInfo);
    userId = user._id.toString();
    authToken = jwt.sign({ id: userId }, process.env.JWT_SECRET!, { expiresIn: '1h' });

    const foodType = await foodTypeModel.create(mockFoodType);
    foodTypeId = foodType._id.toString();
  });

  afterEach(async () => {
    await dbHandler.clearDatabase();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  describe('POST /api/food-item', () => {
    test('should create food item with authentication', async () => {
      const foodItemData = {
        userId: userId,
        typeId: foodTypeId,
        expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        percentLeft: 100,
      };

      const response = await request(app)
        .post('/api/food-item')
        .set('Authorization', `Bearer ${authToken}`)
        .send(foodItemData)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('foodItem');
      expect(response.body.data.foodItem).toHaveProperty('_id');
      expect(response.body.data.foodItem.percentLeft).toBe(100);
    });

    test('should return 401 without authentication token', async () => {
      const foodItemData = {
        userId: new mongoose.Types.ObjectId(userId),
        typeId: new mongoose.Types.ObjectId(foodTypeId),
        expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        percentLeft: 100,
      };

      await request(app)
        .post('/api/food-item')
        .send(foodItemData)
        .expect(401);
    });

    test('should return 401 with invalid token', async () => {
      const foodItemData = {
        userId: new mongoose.Types.ObjectId(userId),
        typeId: new mongoose.Types.ObjectId(foodTypeId),
        expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        percentLeft: 100,
      };

      await request(app)
        .post('/api/food-item')
        .set('Authorization', 'Bearer invalid-token')
        .send(foodItemData)
        .expect(401);
    });

    test('should handle Error exceptions during creation', async () => {
      jest.spyOn(foodItemModel, 'create').mockRejectedValueOnce(new Error('Database error'));

      const foodItemData = {
        userId: new mongoose.Types.ObjectId(userId),
        typeId: new mongoose.Types.ObjectId(foodTypeId),
        expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        percentLeft: 100,
      };

      const response = await request(app)
        .post('/api/food-item')
        .set('Authorization', `Bearer ${authToken}`)
        .send(foodItemData)
        .expect(500);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Database error');
    });

    test('should handle non-Error exceptions during creation', async () => {
      jest.spyOn(foodItemModel, 'create').mockRejectedValueOnce('string error');

      const foodItemData = {
        userId: new mongoose.Types.ObjectId(userId),
        typeId: new mongoose.Types.ObjectId(foodTypeId),
        expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        percentLeft: 100,
      };

      await request(app)
        .post('/api/food-item')
        .set('Authorization', `Bearer ${authToken}`)
        .send(foodItemData)
        .expect(500);
    });
  });

  describe('PUT /api/food-item', () => {
    test('should update food item successfully', async () => {
      // Create a food item first
      const foodItem = await foodItemModel.create(
        mockFoodItem(new mongoose.Types.ObjectId(userId), new mongoose.Types.ObjectId(foodTypeId))
      );

      const updates = {
        _id: foodItem._id,
        percentLeft: 50,
        expirationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      };

      const response = await request(app)
        .put('/api/food-item')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.data.foodItem.percentLeft).toBe(50);
    });

    test('should return 404 for non-existent food item', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put('/api/food-item')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          _id: fakeId,
          percentLeft: 50,
        })
        .expect(404);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('not found');
    });

    test('should return 401 without authentication token', async () => {
      await request(app)
        .put('/api/food-item')
        .send({ _id: new mongoose.Types.ObjectId(), percentLeft: 50 })
        .expect(401);
    });

    test('should handle Error exceptions during update', async () => {
      jest.spyOn(foodItemModel, 'update').mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .put('/api/food-item')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          _id: new mongoose.Types.ObjectId(),
          percentLeft: 50,
        })
        .expect(500);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Database error');
    });

    test('should handle non-Error exceptions during update', async () => {
      jest.spyOn(foodItemModel, 'update').mockRejectedValueOnce('string error');

      await request(app)
        .put('/api/food-item')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          _id: new mongoose.Types.ObjectId(),
          percentLeft: 50,
        })
        .expect(500);
    });
  });

  describe('GET /api/food-item/:_id', () => {
    test('should get food item by id', async () => {
      // Create a food item first
      const foodItem = await foodItemModel.create(
        mockFoodItem(new mongoose.Types.ObjectId(userId), new mongoose.Types.ObjectId(foodTypeId))
      );

      const response = await request(app)
        .get(`/api/food-item/${foodItem._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.data).toHaveProperty('foodItem');
      expect(response.body.data.foodItem._id).toBe(foodItem._id.toString());
    });

    test('should return 404 for non-existent id', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/food-item/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('not found');
    });

    test('should return 401 without authentication token', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .get(`/api/food-item/${fakeId}`)
        .expect(401);
    });

    test('should handle Error exceptions during findById', async () => {
      jest.spyOn(foodItemModel, 'findById').mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .get(`/api/food-item/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Database error');
    });

    test('should handle non-Error exceptions during findById', async () => {
      jest.spyOn(foodItemModel, 'findById').mockRejectedValueOnce('string error');

      await request(app)
        .get(`/api/food-item/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);
    });
  });

  describe('DELETE /api/food-item/:_id', () => {
    test('should delete food item successfully', async () => {
      // Create a food item first
      const foodItem = await foodItemModel.create(
        mockFoodItem(new mongoose.Types.ObjectId(userId), new mongoose.Types.ObjectId(foodTypeId))
      );

      const response = await request(app)
        .delete(`/api/food-item/${foodItem._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('deleted');

      // Verify it was actually deleted
      const deletedItem = await foodItemModel.findById(foodItem._id);
      expect(deletedItem).toBeNull();
    });

    test('should return 404 for non-existent food item', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/food-item/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('not found');
    });

    test('should return 401 without authentication token', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .delete(`/api/food-item/${fakeId}`)
        .expect(401);
    });

    test('should handle Error exceptions during deletion', async () => {
      jest.spyOn(foodItemModel, 'delete').mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .delete(`/api/food-item/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Database error');
    });

    test('should handle non-Error exceptions during deletion', async () => {
      jest.spyOn(foodItemModel, 'delete').mockRejectedValueOnce('string error');

      await request(app)
        .delete(`/api/food-item/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);
    });
  });
});

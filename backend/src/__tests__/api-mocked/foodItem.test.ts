/**
 * FoodItem Controller API Tests - WITH MOCKING
 *
 * Tests for all food item CRUD endpoints
 * Aims for 100% line coverage of foodItem controller
 */

import { describe, expect, test, jest, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { createTestApp } from '../helpers/testApp';
import * as dbHandler from '../helpers/dbHandler';
import { userModel } from '../../models/user';
import { foodTypeModel } from '../../models/foodType';
import { foodItemModel } from '../../models/foodItem';
import { mockGoogleUserInfo } from '../helpers/testData';

/**
 * =============================================================================
 * TEST SUITE FOR: POST /api/food-item
 * =============================================================================
 */

describe('POST /api/food-item - Create Food Item', () => {
  const app = createTestApp();
  let authToken: string;
  let userId: string;
  let foodTypeId: string;

  beforeAll(async () => {
    await dbHandler.connect();
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    // Create test user
    const user = await userModel.create(mockGoogleUserInfo);
    userId = user._id.toString();
    authToken = jwt.sign({ id: userId }, process.env.JWT_SECRET!, { expiresIn: '1h' });

    // Create test food type
    const foodType = await foodTypeModel.create({
      name: 'Apple',
      nutritionalInfo: {
        calories: 52,
        protein: 0.3,
        carbohydrates: 14,
        fat: 0.2,
      },
    });
    foodTypeId = foodType._id.toString();
  });

  afterEach(async () => {
    await dbHandler.clearDatabase();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  /**
   * Test: Create food item successfully with authentication
   */
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

    expect(response.body).toHaveProperty('message', 'FoodItem created successfully');
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('foodItem');
    expect(response.body.data.foodItem).toHaveProperty('_id');
    expect(response.body.data.foodItem.percentLeft).toBe(100);

    console.log('[TEST] ✓ Food item created successfully');
  });

  /**
   * Test: Reject request without authentication
   */
  test('should return 401 without authentication token', async () => {
    const foodItemData = {
      userId: userId,
      typeId: foodTypeId,
      expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      percentLeft: 100,
    };

    await request(app)
      .post('/api/food-item')
      .send(foodItemData)
      .expect(401);

    console.log('[TEST] ✓ Rejected request without auth');
  });

  /**
   * Test: Reject request with invalid token
   */
  test('should return 401 with invalid token', async () => {
    const foodItemData = {
      userId: userId,
      typeId: foodTypeId,
      expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      percentLeft: 100,
    };

    await request(app)
      .post('/api/food-item')
      .set('Authorization', 'Bearer invalid-token')
      .send(foodItemData)
      .expect(401);

    console.log('[TEST] ✓ Rejected request with invalid token');
  });

  /**
   * Test: Handle Error exceptions during creation
   * Tests lines 26-32 (error handling)
   */
  test('should handle Error exceptions during creation', async () => {
    jest.spyOn(foodItemModel, 'create').mockRejectedValueOnce(new Error('Database error'));

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
      .expect(500);

    expect(response.body).toHaveProperty('message', 'Database error');

    console.log('[TEST] ✓ Handled Error exception during creation');
  });

  /**
   * Test: Handle non-Error exceptions during creation
   * Tests line 34 (next(error) call)
   */
  test('should handle non-Error exceptions during creation', async () => {
    jest.spyOn(foodItemModel, 'create').mockRejectedValueOnce('string error');

    const foodItemData = {
      userId: userId,
      typeId: foodTypeId,
      expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      percentLeft: 100,
    };

    await request(app)
      .post('/api/food-item')
      .set('Authorization', `Bearer ${authToken}`)
      .send(foodItemData)
      .expect(500);

    console.log('[TEST] ✓ Handled non-Error exception during creation');
  });
});

/**
 * =============================================================================
 * TEST SUITE FOR: PUT /api/food-item
 * =============================================================================
 */

describe('PUT /api/food-item - Update Food Item', () => {
  const app = createTestApp();
  let authToken: string;
  let userId: string;
  let foodTypeId: string;
  let foodItemId: string;

  beforeAll(async () => {
    await dbHandler.connect();
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    // Create test user
    const user = await userModel.create(mockGoogleUserInfo);
    userId = user._id.toString();
    authToken = jwt.sign({ id: userId }, process.env.JWT_SECRET!, { expiresIn: '1h' });

    // Create test food type
    const foodType = await foodTypeModel.create({
      name: 'Banana',
      nutritionalInfo: {
        calories: 89,
        protein: 1.1,
        carbohydrates: 23,
        fat: 0.3,
      },
    });
    foodTypeId = foodType._id.toString();

    // Create test food item
    const foodItem = await foodItemModel.create({
      userId: userId,
      typeId: foodTypeId,
      expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      percentLeft: 100,
    });
    foodItemId = foodItem._id.toString();
  });

  afterEach(async () => {
    await dbHandler.clearDatabase();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  /**
   * Test: Update food item successfully
   */
  test('should update food item successfully', async () => {
    const updateData = {
      _id: foodItemId,
      userId: userId,
      typeId: foodTypeId,
      percentLeft: 75,
      expirationDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    };

    const response = await request(app)
      .put('/api/food-item')
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateData)
      .expect(200);

    expect(response.body).toHaveProperty('message', 'FoodItem updated successfully');
    expect(response.body.data.foodItem.percentLeft).toBe(75);

    console.log('[TEST] ✓ Food item updated successfully');
  });

  /**
   * Test: Return 404 when updating non-existent food item
   * Tests lines 48-52
   */
  test('should return 404 when updating non-existent food item', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const updateData = {
      _id: fakeId,
      userId: userId,
      typeId: foodTypeId,
      percentLeft: 50,
    };

    const response = await request(app)
      .put('/api/food-item')
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateData)
      .expect(404);

    expect(response.body.message).toContain('not found');

    console.log('[TEST] ✓ Returned 404 for non-existent food item');
  });

  /**
   * Test: Reject request without authentication
   */
  test('should return 401 without authentication token', async () => {
    const updateData = {
      _id: foodItemId,
      percentLeft: 50,
    };

    await request(app)
      .put('/api/food-item')
      .send(updateData)
      .expect(401);

    console.log('[TEST] ✓ Rejected update without auth');
  });

  /**
   * Test: Handle Error exceptions during update
   * Tests lines 64-68
   */
  test('should handle Error exceptions during update', async () => {
    jest.spyOn(foodItemModel, 'update').mockRejectedValueOnce(new Error('Update failed'));

    const updateData = {
      _id: foodItemId,
      userId: userId,
      typeId: foodTypeId,
      percentLeft: 75,
    };

    const response = await request(app)
      .put('/api/food-item')
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateData)
      .expect(500);

    expect(response.body.message).toBe('Update failed');

    console.log('[TEST] ✓ Handled Error exception during update');
  });

  /**
   * Test: Handle non-Error exceptions during update
   * Tests line 70 (next(error) call)
   */
  test('should handle non-Error exceptions during update', async () => {
    jest.spyOn(foodItemModel, 'update').mockRejectedValueOnce('string error');

    const updateData = {
      _id: foodItemId,
      userId: userId,
      typeId: foodTypeId,
      percentLeft: 75,
    };

    await request(app)
      .put('/api/food-item')
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateData)
      .expect(500);

    console.log('[TEST] ✓ Handled non-Error exception during update');
  });
});

/**
 * =============================================================================
 * TEST SUITE FOR: GET /api/food-item/:_id
 * =============================================================================
 */

describe('GET /api/food-item/:_id - Get Food Item by ID', () => {
  const app = createTestApp();
  let authToken: string;
  let userId: string;
  let foodTypeId: string;
  let foodItemId: string;

  beforeAll(async () => {
    await dbHandler.connect();
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    // Create test user
    const user = await userModel.create(mockGoogleUserInfo);
    userId = user._id.toString();
    authToken = jwt.sign({ id: userId }, process.env.JWT_SECRET!, { expiresIn: '1h' });

    // Create test food type
    const foodType = await foodTypeModel.create({
      name: 'Milk',
      nutritionalInfo: {
        calories: 42,
        protein: 3.4,
        carbohydrates: 5,
        fat: 1,
      },
    });
    foodTypeId = foodType._id.toString();

    // Create test food item
    const foodItem = await foodItemModel.create({
      userId: userId,
      typeId: foodTypeId,
      expirationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      percentLeft: 100,
    });
    foodItemId = foodItem._id.toString();
  });

  afterEach(async () => {
    await dbHandler.clearDatabase();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  /**
   * Test: Get food item by ID successfully
   */
  test('should get food item by ID successfully', async () => {
    const response = await request(app)
      .get(`/api/food-item/${foodItemId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('message', 'FoodItem fetched successfully');
    expect(response.body.data.foodItem._id).toBe(foodItemId);
    expect(response.body.data.foodItem.percentLeft).toBe(100);

    console.log('[TEST] ✓ Food item fetched by ID successfully');
  });

  /**
   * Test: Return 404 when food item not found
   * Tests lines 84-88
   */
  test('should return 404 when food item not found', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    const response = await request(app)
      .get(`/api/food-item/${fakeId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);

    expect(response.body.message).toContain('not found');

    console.log('[TEST] ✓ Returned 404 for non-existent food item');
  });

  /**
   * Test: Reject request without authentication
   */
  test('should return 401 without authentication token', async () => {
    await request(app)
      .get(`/api/food-item/${foodItemId}`)
      .expect(401);

    console.log('[TEST] ✓ Rejected GET request without auth');
  });

  /**
   * Test: Handle Error exceptions during fetch
   * Tests lines 100-104
   */
  test('should handle Error exceptions during fetch', async () => {
    jest.spyOn(foodItemModel, 'findById').mockRejectedValueOnce(new Error('Fetch failed'));

    const response = await request(app)
      .get(`/api/food-item/${foodItemId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(500);

    expect(response.body.message).toBe('Fetch failed');

    console.log('[TEST] ✓ Handled Error exception during fetch');
  });

  /**
   * Test: Handle non-Error exceptions during fetch
   * Tests line 106 (next(error) call)
   */
  test('should handle non-Error exceptions during fetch', async () => {
    jest.spyOn(foodItemModel, 'findById').mockRejectedValueOnce('string error');

    await request(app)
      .get(`/api/food-item/${foodItemId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(500);

    console.log('[TEST] ✓ Handled non-Error exception during fetch');
  });
});

/**
 * =============================================================================
 * TEST SUITE FOR: DELETE /api/food-item/:_id
 * =============================================================================
 */

describe('DELETE /api/food-item/:_id - Delete Food Item', () => {
  const app = createTestApp();
  let authToken: string;
  let userId: string;
  let foodTypeId: string;
  let foodItemId: string;

  beforeAll(async () => {
    await dbHandler.connect();
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    // Create test user
    const user = await userModel.create(mockGoogleUserInfo);
    userId = user._id.toString();
    authToken = jwt.sign({ id: userId }, process.env.JWT_SECRET!, { expiresIn: '1h' });

    // Create test food type
    const foodType = await foodTypeModel.create({
      name: 'Cheese',
      nutritionalInfo: {
        calories: 402,
        protein: 25,
        carbohydrates: 1.3,
        fat: 33,
      },
    });
    foodTypeId = foodType._id.toString();

    // Create test food item
    const foodItem = await foodItemModel.create({
      userId: userId,
      typeId: foodTypeId,
      expirationDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      percentLeft: 100,
    });
    foodItemId = foodItem._id.toString();
  });

  afterEach(async () => {
    await dbHandler.clearDatabase();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  /**
   * Test: Delete food item successfully
   */
  test('should delete food item successfully', async () => {
    const response = await request(app)
      .delete(`/api/food-item/${foodItemId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('message', 'FoodItem deleted successfully');
    expect(response.body.data.foodItem._id).toBe(foodItemId);

    // Verify deletion
    const deletedItem = await foodItemModel.findById(foodItemId as any);
    expect(deletedItem).toBeNull();

    console.log('[TEST] ✓ Food item deleted successfully');
  });

  /**
   * Test: Return 404 when deleting non-existent food item
   * Tests lines 121-125
   */
  test('should return 404 when deleting non-existent food item', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    const response = await request(app)
      .delete(`/api/food-item/${fakeId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);

    expect(response.body.message).toContain('not found');

    console.log('[TEST] ✓ Returned 404 for non-existent food item');
  });

  /**
   * Test: Reject request without authentication
   */
  test('should return 401 without authentication token', async () => {
    await request(app)
      .delete(`/api/food-item/${foodItemId}`)
      .expect(401);

    console.log('[TEST] ✓ Rejected DELETE request without auth');
  });

  /**
   * Test: Handle Error exceptions during deletion
   * Tests lines 137-141
   */
  test('should handle Error exceptions during deletion', async () => {
    jest.spyOn(foodItemModel, 'delete').mockRejectedValueOnce(new Error('Deletion failed'));

    const response = await request(app)
      .delete(`/api/food-item/${foodItemId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(500);

    expect(response.body.message).toBe('Deletion failed');

    console.log('[TEST] ✓ Handled Error exception during deletion');
  });

  /**
   * Test: Handle non-Error exceptions during deletion
   * Tests line 143 (next(error) call)
   */
  test('should handle non-Error exceptions during deletion', async () => {
    jest.spyOn(foodItemModel, 'delete').mockRejectedValueOnce('string error');

    await request(app)
      .delete(`/api/food-item/${foodItemId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(500);

    console.log('[TEST] ✓ Handled non-Error exception during deletion');
  });
});

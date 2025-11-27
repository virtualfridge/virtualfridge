/**
 * FoodType Controller API Tests - WITH MOCKING
 *
 * Tests for all food type CRUD endpoints
 * Aims for 100% line coverage of foodType controller
 *
 * NOTE: SKIPPED - FoodType routes were removed in merge from main
 */

import { describe, expect, test, jest, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { createTestApp } from '../helpers/testApp';
import * as dbHandler from '../helpers/dbHandler';
import { userModel } from '../../models/user';
import { foodTypeModel } from '../../models/foodType';
import { mockGoogleUserInfo } from '../helpers/testData';

/**
 * =============================================================================
 * TEST SUITE FOR: POST /api/food-type
 * =============================================================================
 */

describe.skip('POST /api/food-type - Create Food Type', () => {
  const app = createTestApp();
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    await dbHandler.connect();
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    // Create test user
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
   * Test: Create food type successfully
   */
  test('should create food type successfully', async () => {
    const foodTypeData = {
      name: 'Strawberry',
      nutritionalInfo: {
        calories: 32,
        protein: 0.7,
        carbohydrates: 8,
        fat: 0.3,
      },
      shelfLifeDays: 7,
    };

    const response = await request(app)
      .post('/api/food-type')
      .set('Authorization', `Bearer ${authToken}`)
      .send(foodTypeData)
      .expect(200);

    expect(response.body).toHaveProperty('message', 'FoodType created successfully');
    expect(response.body.data.foodType.name).toBe('Strawberry');
    expect(response.body.data.foodType.shelfLifeDays).toBe(7);

    console.log('[TEST] ✓ Food type created successfully');
  });

  /**
   * Test: Reject request without authentication
   */
  test('should return 401 without authentication token', async () => {
    const foodTypeData = {
      name: 'Orange',
      nutritionalInfo: {
        calories: 47,
        protein: 0.9,
        carbohydrates: 12,
        fat: 0.1,
      },
    };

    await request(app)
      .post('/api/food-type')
      .send(foodTypeData)
      .expect(401);

    console.log('[TEST] ✓ Rejected creation without auth');
  });

  /**
   * Test: Handle Error exceptions during creation
   * Tests lines 29-33
   */
  test('should handle Error exceptions during creation', async () => {
    jest.spyOn(foodTypeModel, 'create').mockRejectedValueOnce(new Error('Database error'));

    const foodTypeData = {
      name: 'Grape',
      nutritionalInfo: {
        calories: 69,
        protein: 0.7,
        carbohydrates: 18,
        fat: 0.2,
      },
    };

    const response = await request(app)
      .post('/api/food-type')
      .set('Authorization', `Bearer ${authToken}`)
      .send(foodTypeData)
      .expect(500);

    expect(response.body.message).toBe('Database error');

    console.log('[TEST] ✓ Handled Error exception during creation');
  });

  /**
   * Test: Handle non-Error exceptions during creation
   * Tests line 35 (next(error) call)
   */
  test('should handle non-Error exceptions during creation', async () => {
    jest.spyOn(foodTypeModel, 'create').mockRejectedValueOnce('string error');

    const foodTypeData = {
      name: 'Mango',
      nutritionalInfo: {
        calories: 60,
        protein: 0.8,
        carbohydrates: 15,
        fat: 0.4,
      },
    };

    await request(app)
      .post('/api/food-type')
      .set('Authorization', `Bearer ${authToken}`)
      .send(foodTypeData)
      .expect(500);

    console.log('[TEST] ✓ Handled non-Error exception during creation');
  });
});

/**
 * =============================================================================
 * TEST SUITE FOR: PUT /api/food-type & PATCH /api/food-type/:_id
 * =============================================================================
 */

describe.skip('PUT /api/food-type & PATCH /api/food-type/:_id - Update Food Type', () => {
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
      name: 'Tomato',
      nutritionalInfo: {
        calories: 18,
        protein: 0.9,
        carbohydrates: 3.9,
        fat: 0.2,
      },
      shelfLifeDays: 7,
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
   * Test: Update food type via PUT (with _id in body)
   */
  test('should update food type via PUT with _id in body', async () => {
    const updateData = {
      _id: foodTypeId,
      name: 'Tomato (Updated)',
      shelfLifeDays: 10,
    };

    const response = await request(app)
      .put(`/api/food-type/${foodTypeId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateData)
      .expect(200);

    expect(response.body).toHaveProperty('message', 'FoodType updated successfully');
    expect(response.body.data.foodType.name).toBe('Tomato (Updated)');
    expect(response.body.data.foodType.shelfLifeDays).toBe(10);

    console.log('[TEST] ✓ Food type updated via PUT');
  });

  /**
   * Test: Update food type via PATCH (with _id in params)
   */
  test('should update food type via PATCH with _id in params', async () => {
    const updateData = {
      shelfLifeDays: 14,
    };

    const response = await request(app)
      .patch(`/api/food-type/${foodTypeId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateData)
      .expect(200);

    expect(response.body).toHaveProperty('message', 'FoodType updated successfully');
    expect(response.body.data.foodType.shelfLifeDays).toBe(14);

    console.log('[TEST] ✓ Food type updated via PATCH');
  });

  /**
   * Test: Return 400 when no ID provided
   * Tests lines 48-50
   */
  test('should return 404 when no ID in path', async () => {
    const updateData = {
      name: 'No ID Test',
    };

    const response = await request(app)
      .put('/api/food-type')
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateData)
      .expect(404);

    expect(response.body).toHaveProperty('message');

    console.log('[TEST] ✓ Returned 404 when no ID in path');
  });

  /**
   * Test: Return 404 when updating non-existent food type
   * Tests lines 55-59
   */
  test('should return 404 when updating non-existent food type', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const updateData = {
      _id: fakeId,
      name: 'Non-existent',
    };

    const response = await request(app)
      .put(`/api/food-type/${fakeId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateData)
      .expect(404);

    expect(response.body.message).toContain('not found');

    console.log('[TEST] ✓ Returned 404 for non-existent food type');
  });

  /**
   * Test: Reject request without authentication
   */
  test('should return 401 without authentication token', async () => {
    const updateData = {
      _id: foodTypeId,
      name: 'Unauthorized Update',
    };

    await request(app)
      .put('/api/food-type')
      .send(updateData)
      .expect(401);

    console.log('[TEST] ✓ Rejected update without auth');
  });

  /**
   * Test: Handle Error exceptions during update
   * Tests lines 71-75
   */
  test('should handle Error exceptions during update', async () => {
    jest.spyOn(foodTypeModel, 'update').mockRejectedValueOnce(new Error('Failed to update foodType'));

    const updateData = {
      _id: foodTypeId,
      name: 'Error Test',
    };

    const response = await request(app)
      .put(`/api/food-type/${foodTypeId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateData)
      .expect(500);

    expect(response.body.message).toBe('Failed to update foodType');

    console.log('[TEST] ✓ Handled Error exception during update');
  });

  /**
   * Test: Handle non-Error exceptions during update
   * Tests line 77 (next(error) call)
   */
  test('should handle non-Error exceptions during update', async () => {
    jest.spyOn(foodTypeModel, 'update').mockRejectedValueOnce('string error');

    const updateData = {
      _id: foodTypeId,
      name: 'Error Test',
    };

    await request(app)
      .put(`/api/food-type/${foodTypeId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateData)
      .expect(500);

    console.log('[TEST] ✓ Handled non-Error exception during update');
  });
});

/**
 * =============================================================================
 * TEST SUITE FOR: GET /api/food-type/:_id
 * =============================================================================
 */

describe.skip('GET /api/food-type/:_id - Get Food Type by ID', () => {
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
      name: 'Lettuce',
      nutritionalInfo: {
        calories: 15,
        protein: 1.4,
        carbohydrates: 2.9,
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
   * Test: Get food type by ID successfully
   */
  test('should get food type by ID successfully', async () => {
    const response = await request(app)
      .get(`/api/food-type/${foodTypeId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('name', 'Lettuce');
    expect(response.body).toHaveProperty('_id', foodTypeId);

    console.log('[TEST] ✓ Food type fetched by ID successfully');
  });

  /**
   * Test: Return 404 when food type not found
   * Tests lines 91-95
   */
  test('should return 404 when food type not found', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    const response = await request(app)
      .get(`/api/food-type/${fakeId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);

    expect(response.body.message).toContain('not found');

    console.log('[TEST] ✓ Returned 404 for non-existent food type');
  });

  /**
   * Test: Reject request without authentication
   */
  test('should return 401 without authentication token', async () => {
    await request(app)
      .get(`/api/food-type/${foodTypeId}`)
      .expect(401);

    console.log('[TEST] ✓ Rejected GET request without auth');
  });

  /**
   * Test: Handle Error exceptions during fetch
   * Tests lines 104-108
   */
  test('should handle Error exceptions during fetch', async () => {
    jest.spyOn(foodTypeModel, 'findById').mockRejectedValueOnce(new Error('Fetch failed'));

    const response = await request(app)
      .get(`/api/food-type/${foodTypeId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(500);

    expect(response.body.message).toBe('Fetch failed');

    console.log('[TEST] ✓ Handled Error exception during fetch');
  });

  /**
   * Test: Handle non-Error exceptions during fetch
   * Tests line 110 (next(error) call)
   */
  test('should handle non-Error exceptions during fetch', async () => {
    jest.spyOn(foodTypeModel, 'findById').mockRejectedValueOnce('string error');

    await request(app)
      .get(`/api/food-type/${foodTypeId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(500);

    console.log('[TEST] ✓ Handled non-Error exception during fetch');
  });
});

/**
 * =============================================================================
 * TEST SUITE FOR: DELETE /api/food-type/:_id
 * =============================================================================
 */

describe.skip('DELETE /api/food-type/:_id - Delete Food Type', () => {
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
      name: 'Carrot',
      nutritionalInfo: {
        calories: 41,
        protein: 0.9,
        carbohydrates: 10,
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
   * Test: Delete food type successfully
   */
  test('should delete food type successfully', async () => {
    const response = await request(app)
      .delete(`/api/food-type/${foodTypeId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('_id', foodTypeId);
    expect(response.body).toHaveProperty('name', 'Carrot');

    // Verify deletion
    const deletedType = await foodTypeModel.findById(new mongoose.Types.ObjectId(foodTypeId));
    expect(deletedType).toBeNull();

    console.log('[TEST] ✓ Food type deleted successfully');
  });

  /**
   * Test: Return 404 when deleting non-existent food type
   * Tests lines 125-129
   */
  test('should return 404 when deleting non-existent food type', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    const response = await request(app)
      .delete(`/api/food-type/${fakeId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);

    expect(response.body.message).toContain('not found');

    console.log('[TEST] ✓ Returned 404 for non-existent food type');
  });

  /**
   * Test: Reject request without authentication
   */
  test('should return 401 without authentication token', async () => {
    await request(app)
      .delete(`/api/food-type/${foodTypeId}`)
      .expect(401);

    console.log('[TEST] ✓ Rejected DELETE request without auth');
  });

  /**
   * Test: Handle Error exceptions during deletion
   * Tests lines 138-142
   */
  test('should handle Error exceptions during deletion', async () => {
    jest.spyOn(foodTypeModel, 'delete').mockRejectedValueOnce(new Error('Deletion failed'));

    const response = await request(app)
      .delete(`/api/food-type/${foodTypeId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(500);

    expect(response.body.message).toBe('Deletion failed');

    console.log('[TEST] ✓ Handled Error exception during deletion');
  });

  /**
   * Test: Handle non-Error exceptions during deletion
   * Tests line 144 (next(error) call)
   */
  test('should handle non-Error exceptions during deletion', async () => {
    jest.spyOn(foodTypeModel, 'delete').mockRejectedValueOnce('string error');

    await request(app)
      .delete(`/api/food-type/${foodTypeId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(500);

    console.log('[TEST] ✓ Handled non-Error exception during deletion');
  });
});

/**
 * =============================================================================
 * TEST SUITE FOR: GET /api/food-type/barcode/:barcodeId
 * =============================================================================
 */

describe.skip('GET /api/food-type/barcode/:barcodeId - Get Food Type by Barcode', () => {
  const app = createTestApp();
  let authToken: string;
  let userId: string;
  let foodTypeId: string;
  const testBarcode = '1234567890123';

  beforeAll(async () => {
    await dbHandler.connect();
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    // Create test user
    const user = await userModel.create(mockGoogleUserInfo);
    userId = user._id.toString();
    authToken = jwt.sign({ id: userId }, process.env.JWT_SECRET!, { expiresIn: '1h' });

    // Create test food type with barcode
    const foodType = await foodTypeModel.create({
      name: 'Canned Beans',
      barcodeId: testBarcode,
      nutritionalInfo: {
        calories: 100,
        protein: 6,
        carbohydrates: 18,
        fat: 0.5,
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
   * Test: Get food type by barcode successfully
   */
  test('should get food type by barcode successfully', async () => {
    const response = await request(app)
      .get(`/api/food-type/barcode/${testBarcode}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('name', 'Canned Beans');
    expect(response.body).toHaveProperty('barcodeId', testBarcode);
    expect(response.body).toHaveProperty('_id', foodTypeId);

    console.log('[TEST] ✓ Food type fetched by barcode successfully');
  });

  /**
   * Test: Return 404 when barcode not found
   * Tests lines 158-162
   */
  test('should return 404 when barcode not found', async () => {
    const fakeBarcode = '9999999999999';

    const response = await request(app)
      .get(`/api/food-type/barcode/${fakeBarcode}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);

    expect(response.body.message).toContain('not found');

    console.log('[TEST] ✓ Returned 404 for non-existent barcode');
  });

  /**
   * Test: Reject request without authentication
   */
  test('should return 401 without authentication token', async () => {
    await request(app)
      .get(`/api/food-type/barcode/${testBarcode}`)
      .expect(401);

    console.log('[TEST] ✓ Rejected barcode request without auth');
  });

  /**
   * Test: Handle Error exceptions during barcode lookup
   * Tests lines 171-175
   */
  test('should handle Error exceptions during barcode lookup', async () => {
    jest.spyOn(foodTypeModel, 'findByBarcode').mockRejectedValueOnce(new Error('Barcode lookup failed'));

    const response = await request(app)
      .get(`/api/food-type/barcode/${testBarcode}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(500);

    expect(response.body.message).toBe('Barcode lookup failed');

    console.log('[TEST] ✓ Handled Error exception during barcode lookup');
  });

  /**
   * Test: Handle non-Error exceptions during barcode lookup
   * Tests line 177 (next(error) call)
   */
  test('should handle non-Error exceptions during barcode lookup', async () => {
    jest.spyOn(foodTypeModel, 'findByBarcode').mockRejectedValueOnce('string error');

    await request(app)
      .get(`/api/food-type/barcode/${testBarcode}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(500);

    console.log('[TEST] ✓ Handled non-Error exception during barcode lookup');
  });
});

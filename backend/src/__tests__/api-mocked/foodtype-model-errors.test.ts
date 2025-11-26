/**
 * FoodType Model - API Error Path Coverage
 *
 * Tests foodType.ts error handling through API endpoints
 *
 * Coverage targets:
 * - create: lines 43-45
 * - update: lines 61-63
 * - delete: lines 70-72
 * - findById: lines 81-83
 *
 * Note: Tests for findByBarcode, findByName, and findByIds have been moved
 * to src/__tests__/unit/foodtype-model.test.ts as they have no API endpoints
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
import { mockGoogleUserInfo, mockFoodType } from '../helpers/testData';

describe('FoodType Model - Error Path Coverage', () => {
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
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  /**
   * Test: create error handling
   * Tests foodType.ts lines 43-45
   * Endpoint: POST /api/food-type
   */
  test('should handle database error in foodType.create()', async () => {
    // Mock the internal mongoose model's create method to throw error
    const originalCreate = foodTypeModel['foodType'].create;
    foodTypeModel['foodType'].create = jest.fn().mockRejectedValueOnce(new Error('DB connection error'));

    const response = await request(app)
      .post('/api/food-type')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Apple',
        nutrients: { calories: '52' },
      })
      .expect(500);

    expect(response.body.message).toBe('Failed to create foodType');

    // Restore
    foodTypeModel['foodType'].create = originalCreate;

    console.log('[TEST] ✓ Handled error in foodType.create() (lines 43-45)');
  });

  /**
   * Test: update error handling
   * Tests foodType.ts lines 61-63
   * Endpoint: PATCH /api/food-type/:id
   */
  test('should handle database error in foodType.update()', async () => {
    // Create a food type first
    const foodType = await foodTypeModel.create({
      name: 'Banana',
      nutrients: { calories: '89' },
    });

    // Mock findByIdAndUpdate to throw error
    const originalUpdate = foodTypeModel['foodType'].findByIdAndUpdate;
    foodTypeModel['foodType'].findByIdAndUpdate = jest.fn().mockRejectedValueOnce(new Error('Update failed'));

    const response = await request(app)
      .patch(`/api/food-type/${foodType._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Updated Banana' })
      .expect(500);

    expect(response.body.message).toBe('Failed to update foodType');

    // Restore
    foodTypeModel['foodType'].findByIdAndUpdate = originalUpdate;

    console.log('[TEST] ✓ Handled error in foodType.update() (lines 61-63)');
  });

  /**
   * Test: delete error handling
   * Tests foodType.ts lines 70-72
   * Endpoint: DELETE /api/food-type/:id
   */
  test('should handle database error in foodType.delete()', async () => {
    // Create a food type first
    const foodType = await foodTypeModel.create({
      name: 'Orange',
      nutrients: { calories: '47' },
    });

    // Mock findByIdAndDelete to throw error
    const originalDelete = foodTypeModel['foodType'].findByIdAndDelete;
    foodTypeModel['foodType'].findByIdAndDelete = jest.fn().mockRejectedValueOnce(new Error('Delete failed'));

    const response = await request(app)
      .delete(`/api/food-type/${foodType._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(500);

    expect(response.body.message).toBe('Failed to delete foodType');

    // Restore
    foodTypeModel['foodType'].findByIdAndDelete = originalDelete;

    console.log('[TEST] ✓ Handled error in foodType.delete() (lines 70-72)');
  });

  /**
   * Test: findById error handling
   * Tests foodType.ts lines 81-83
   * Endpoint: GET /api/food-type/:id
   */
  test('should handle database error in foodType.findById()', async () => {
    const fakeId = new mongoose.Types.ObjectId();

    // Mock findById to throw error
    const originalFindById = foodTypeModel['foodType'].findById;
    foodTypeModel['foodType'].findById = jest.fn().mockRejectedValueOnce(new Error('Find failed'));

    const response = await request(app)
      .get(`/api/food-type/${fakeId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(500);

    expect(response.body.message).toBe('Failed to find foodType by id');

    // Restore
    foodTypeModel['foodType'].findById = originalFindById;

    console.log('[TEST] ✓ Handled error in foodType.findById() (lines 81-83)');
  });

  /**
   * Additional test: Duplicate key error in create
   * Tests that database constraint violations are handled
   */
  test('should handle duplicate key error in foodType.create()', async () => {
    // Create a food type
    await foodTypeModel.create({
      name: 'Strawberry',
      nutrients: { calories: '32' },
    });

    // Try to create duplicate (name should be unique if enforced)
    // This might succeed if there's no unique constraint, so we mock the error
    const originalCreate = foodTypeModel['foodType'].create;
    const duplicateError = new Error('E11000 duplicate key error');
    (duplicateError as any).code = 11000;
    foodTypeModel['foodType'].create = jest.fn().mockRejectedValueOnce(duplicateError);

    const response = await request(app)
      .post('/api/food-type')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Strawberry',
        nutrients: { calories: '32' },
      })
      .expect(500);

    expect(response.body.message).toBe('Failed to create foodType');

    // Restore
    foodTypeModel['foodType'].create = originalCreate;

    console.log('[TEST] ✓ Handled duplicate key error in foodType.create()');
  });

});

console.log('✓ FoodType model API error tests loaded');

/**
 * Controller Edge Cases - API Tests
 *
 * Tests edge cases and error handling in controllers
 * Target lines:
 * - foodType.ts: 66-77 (error handling)
 * - media.ts: remaining gaps
 * - user.ts: edge cases
 */

import { describe, expect, test, jest, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import path from 'path';
import { createTestApp } from '../helpers/testApp';
import * as dbHandler from '../helpers/dbHandler';
import { userModel } from '../../models/user';
import { foodTypeModel } from '../../models/foodType';
import { mockGoogleUserInfo } from '../helpers/testData';

describe('Controller Edge Cases - Comprehensive API Tests', () => {
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
   * Test: FoodType controller error handling
   * Tests foodType.ts lines 66-77
   */
  test('should handle database error when creating food type', async () => {
    // Mock foodTypeModel.create to throw error
    jest.spyOn(foodTypeModel, 'create')
      .mockRejectedValueOnce(new Error('Failed to create foodType'));

    const response = await request(app)
      .post('/api/food-type')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Food',
        nutrients: {
          calories: '100',
        },
      })
      .expect(500);

    expect(response.body.message).toBe('Failed to create foodType');

    console.log('[TEST] ✓ Handled foodType creation error');
  });

  /**
   * Test: FoodType not found when updating
   * Tests update error path
   */
  test('should handle foodType not found during update', async () => {
    const nonExistentId = '507f1f77bcf86cd799439011';

    const response = await request(app)
      .patch(`/api/food-type/${nonExistentId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Updated Name',
      })
      .expect(404);

    expect(response.body.message).toContain('not found');

    console.log('[TEST] ✓ Handled foodType not found during update');
  });

  /**
   * Test: FoodType not found when deleting
   * Tests delete error path
   */
  test('should handle foodType not found during delete', async () => {
    const nonExistentId = '507f1f77bcf86cd799439011';

    const response = await request(app)
      .delete(`/api/food-type/${nonExistentId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);

    expect(response.body.message).toContain('not found');

    console.log('[TEST] ✓ Handled foodType not found during delete');
  });

  /**
   * Test: FoodType not found by barcode
   * Tests barcode lookup miss
   */
  test('should return 404 when barcode not found', async () => {
    const response = await request(app)
      .get('/api/food-type/barcode/nonexistent-barcode')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);

    expect(response.body.message).toContain('not found');

    console.log('[TEST] ✓ Handled barcode not found');
  });

  /**
   * Test: User profile update with partial data
   * Tests various update paths
   */
  test('should update user profile with partial data', async () => {
    const response = await request(app)
      .post('/api/user/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        bio: 'New bio only',
      })
      .expect(200);

    expect(response.body.data.user.bio).toBe('New bio only');

    console.log('[TEST] ✓ Updated profile with partial data');
  });

  /**
   * Test: User profile update with bio field
   * Tests string handling
   */
  test('should update user profile with bio field', async () => {
    const response = await request(app)
      .post('/api/user/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        bio: 'This is my updated bio',
      })
      .expect(200);

    expect(response.body.data.user.bio).toBe('This is my updated bio');

    console.log('[TEST] ✓ Updated profile with bio field');
  });

  /**
   * Test: User profile update with dietary preferences
   * Tests object handling
   */
  test('should update user profile with dietary preferences', async () => {
    const response = await request(app)
      .post('/api/user/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        dietaryPreferences: {
          vegetarian: true,
          vegan: false,
          glutenFree: true,
        },
      })
      .expect(200);

    expect(response.body.data.user.dietaryPreferences).toHaveProperty('vegetarian', true);

    console.log('[TEST] ✓ Updated profile with dietary preferences');
  });

  /**
   * Test: User deletion
   * Tests delete functionality
   */
  test('should delete user successfully', async () => {
    const response = await request(app)
      .delete('/api/user/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.message).toContain('deleted');

    console.log('[TEST] ✓ Deleted user successfully');
  });

  /**
   * Test: Media upload without file
   * Tests missing file handling
   */
  test('should return error when no file uploaded', async () => {
    const response = await request(app)
      .post('/api/media/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(400);

    expect(response.body.message).toBe('No file uploaded');

    console.log('[TEST] ✓ Handled missing file upload');
  });

  /**
   * Test: Media vision without file
   * Tests missing file handling in vision endpoint
   */
  test('should return error when no file provided for analysis', async () => {
    const response = await request(app)
      .post('/api/media/vision')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(400);

    expect(response.body.message).toBe('No file uploaded');

    console.log('[TEST] ✓ Handled missing file for analysis');
  });

});

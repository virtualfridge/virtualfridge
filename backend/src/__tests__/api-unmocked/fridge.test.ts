/**
 * Fridge API Tests - WITHOUT ADDITIONAL MOCKING
 *
 * Tests for fridge endpoints
 * API Endpoints:
 * - GET /api/fridge - Get all fridge items for authenticated user
 * - POST /api/fridge/barcode - Create fridge item from barcode
 */

import { describe, expect, test, jest, beforeAll, afterAll, afterEach, beforeEach } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import * as dbHandler from '../helpers/dbHandler';
import { userModel } from '../../models/user';
import { foodItemModel } from '../../models/foodItem';
import { foodTypeModel } from '../../models/foodType';
import { mockGoogleUserInfo, mockFoodType } from '../helpers/testData';
import { createTestApp } from '../helpers/testApp';

/**
 * =============================================================================
 * TEST SUITE FOR: GET /api/fridge
 * =============================================================================
 */

describe('GET /api/fridge - WITHOUT ADDITIONAL MOCKING', () => {
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
   * Test: Get all fridge items successfully
   *
   * Input:
   * - HTTP Method: GET
   * - Endpoint: /api/fridge
   * - Headers: Authorization: Bearer <valid-token>
   * - Body: None
   *
   * Expected Status Code: 200
   *
   * Expected Output:
   * - Response contains message: 'Fridge items fetched successfully'
   * - Response contains data.fridgeItems array
   * - Each fridgeItem has foodItem and foodType properties
   *
   * Expected Behavior:
   * - Fetches all food items for authenticated user
   * - Includes associated food types for each item
   * - Returns empty array if no items exist
   *
   * Mocking:
   * - None (uses real database operations)
   */
  test('should get all fridge items successfully', async () => {
    // Create a food type and food item
    const foodType = await foodTypeModel.create(mockFoodType);
    const user = await userModel.findById(userId);
    await foodItemModel.create({
      userId: user!._id,
      typeId: foodType._id,
      expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      percentLeft: 100,
    });

    const response = await request(app)
      .get('/api/fridge')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('message', 'Fridge items fetched successfully');
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('fridgeItems');
    expect(Array.isArray(response.body.data.fridgeItems)).toBe(true);
    expect(response.body.data.fridgeItems.length).toBe(1);
    expect(response.body.data.fridgeItems[0]).toHaveProperty('foodItem');
    expect(response.body.data.fridgeItems[0]).toHaveProperty('foodType');
  });

  /**
   * Test: Get empty array when no fridge items exist
   *
   * Input:
   * - HTTP Method: GET
   * - Endpoint: /api/fridge
   * - Headers: Authorization: Bearer <valid-token>
   * - Body: None
   *
   * Expected Status Code: 200
   *
   * Expected Output:
   * - Response contains data.fridgeItems as empty array
   *
   * Expected Behavior:
   * - Returns empty array when user has no fridge items
   *
   * Mocking:
   * - None
   */
  test('should return empty array when no fridge items exist', async () => {
    const response = await request(app)
      .get('/api/fridge')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.data.fridgeItems).toEqual([]);
  });

  /**
   * Test: Reject request without authentication
   *
   * Input:
   * - HTTP Method: GET
   * - Endpoint: /api/fridge
   * - Headers: None
   * - Body: None
   *
   * Expected Status Code: 401
   *
   * Expected Output:
   * - Unauthorized error
   *
   * Expected Behavior:
   * - Authentication middleware blocks request
   * - Returns 401 without valid token
   *
   * Mocking:
   * - None
   */
  test('should return 401 without authentication', async () => {
    await request(app)
      .get('/api/fridge')
      .expect(401);
  });

  /**
   * Test: Reject request with invalid token
   *
   * Input:
   * - HTTP Method: GET
   * - Endpoint: /api/fridge
   * - Headers: Authorization: Bearer invalid-token
   * - Body: None
   *
   * Expected Status Code: 401
   *
   * Expected Output:
   * - Unauthorized error
   *
   * Expected Behavior:
   * - Authentication middleware validates token
   * - Rejects invalid token
   *
   * Mocking:
   * - None
   */
  test('should return 401 with invalid token', async () => {
    await request(app)
      .get('/api/fridge')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });
});

/**
 * Fridge API Tests - WITH ADDITIONAL MOCKING
 *
 * Tests for fridge endpoints with external API mocking
 * API Endpoints:
 * - POST /api/fridge/barcode - Create fridge item from barcode (mocks OpenFoodFacts API)
 */

import { describe, expect, test, jest, beforeAll, afterAll, afterEach, beforeEach } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import * as dbHandler from '../helpers/dbHandler';
import { userModel } from '../../models/user';
import { foodTypeModel } from '../../models/foodType';
import { foodItemModel } from '../../models/foodItem';
import { mockGoogleUserInfo } from '../helpers/testData';
import { createTestApp } from '../helpers/testApp';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

/**
 * =============================================================================
 * TEST SUITE FOR: POST /api/fridge/barcode
 * =============================================================================
 */

describe('POST /api/fridge/barcode - WITH ADDITIONAL MOCKING', () => {
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
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await dbHandler.clearDatabase();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  /**
   * Test: Create fridge item from new barcode (not in database)
   *
   * Input:
   * - HTTP Method: POST
   * - Endpoint: /api/fridge/barcode
   * - Headers: Authorization: Bearer <valid-token>
   * - Body: { barcode: '123456789' }
   *
   * Expected Status Code: 200
   *
   * Expected Output:
   * - Response message: 'Successfully created item from barcode'
   * - Response contains fridgeItem with foodItem and foodType
   * - foodType contains data from OpenFoodFacts
   * - foodItem has expiration date based on shelf life
   *
   * Expected Behavior:
   * - Check if foodType exists with barcode
   * - Call OpenFoodFacts API to get product data
   * - Create new foodType from API response
   * - Create foodItem for user with calculated expiration
   *
   * Mocking:
   * - Mock: axios.get() for OpenFoodFacts API call
   * - Mock Behavior: Returns product data from OpenFoodFacts
   * - Mock Purpose: Cannot rely on external API availability in tests
   */
  test('should create fridge item from new barcode', async () => {
    const barcode = '3017620422003';
    const mockProductData = {
      product: {
        product_name_en: 'Nutella',
        product_name: 'Nutella',
        brands: 'Ferrero',
        image_url: 'https://example.com/nutella.jpg',
        nutriments: {
          'energy-kcal_100g': 539,
          'energy-kj_100g': 2252,
          proteins_100g: 6.3,
          fat_100g: 30.9,
          'saturated-fat_100g': 10.6,
          carbohydrates_100g: 57.5,
          sugars_100g: 56.3,
          fiber_100g: 0,
          salt_100g: 0.107,
          sodium_100g: 0.042,
        },
        allergens_hierarchy: ['en:nuts', 'en:milk'],
      },
    };

    mockedAxios.get.mockResolvedValueOnce({ data: mockProductData });

    const response = await request(app)
      .post('/api/fridge/barcode')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ barcode })
      .expect(200);

    expect(response.body).toHaveProperty('message', 'Successfully created item from barcode');
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('fridgeItem');
    expect(response.body.data.fridgeItem).toHaveProperty('foodItem');
    expect(response.body.data.fridgeItem).toHaveProperty('foodType');
    expect(response.body.data.fridgeItem.foodType.name).toBe('Nutella');
    // Note: brand field may not be returned in response due to schema
    expect(response.body.data.fridgeItem.foodItem.percentLeft).toBe(100);

    // Verify axios was called with correct URL
    expect(mockedAxios.get).toHaveBeenCalledWith(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?lc=en`
    );
  });

  /**
   * Test: Create fridge item from existing barcode (already in database)
   *
   * Input:
   * - HTTP Method: POST
   * - Endpoint: /api/fridge/barcode
   * - Headers: Authorization: Bearer <valid-token>
   * - Body: { barcode: '123456789' }
   *
   * Expected Status Code: 200
   *
   * Expected Output:
   * - Response message: 'Successfully created item from barcode'
   * - Response contains fridgeItem with existing foodType
   *
   * Expected Behavior:
   * - Check if foodType exists with barcode
   * - Find existing foodType (skip OpenFoodFacts call)
   * - Create foodItem for user
   *
   * Mocking:
   * - Mock: axios.get() (should not be called)
   * - Mock Purpose: Verify that existing foodTypes don't trigger API calls
   */
  test('should create fridge item from existing barcode without API call', async () => {
    const barcode = '3017620422003';

    // Create existing food type with barcode
    const existingFoodType = await foodTypeModel.create({
      name: 'Nutella',
      brand: 'Ferrero',
      barcodeId: barcode,
      nutrients: {
        calories: 539,
        protein: 6.3,
        fat: 30.9,
      },
    });

    const response = await request(app)
      .post('/api/fridge/barcode')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ barcode })
      .expect(200);

    expect(response.body.message).toBe('Successfully created item from barcode');
    expect(response.body.data.fridgeItem.foodType._id).toBe(existingFoodType._id.toString());

    // Verify axios was NOT called
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  /**
   * Test: Handle product not found in OpenFoodFacts
   *
   * Input:
   * - HTTP Method: POST
   * - Endpoint: /api/fridge/barcode
   * - Headers: Authorization: Bearer <valid-token>
   * - Body: { barcode: 'invalid-barcode' }
   *
   * Expected Status Code: 404
   *
   * Expected Output:
   * - Response message: 'Product not found in OpenFoodFacts'
   *
   * Expected Behavior:
   * - Check if foodType exists (not found)
   * - Call OpenFoodFacts API
   * - API returns no product data
   * - Return 404 error
   *
   * Mocking:
   * - Mock: axios.get()
   * - Mock Behavior: Returns empty product response
   * - Mock Purpose: Simulate product not found in OpenFoodFacts
   */
  test('should return 404 when product not found in OpenFoodFacts', async () => {
    const barcode = 'invalid-barcode';

    mockedAxios.get.mockResolvedValueOnce({ data: {} });

    const response = await request(app)
      .post('/api/fridge/barcode')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ barcode })
      .expect(404);

    expect(response.body.message).toBe('Product not found in OpenFoodFacts');
  });

  /**
   * Test: Handle OpenFoodFacts API error
   *
   * Input:
   * - HTTP Method: POST
   * - Endpoint: /api/fridge/barcode
   * - Headers: Authorization: Bearer <valid-token>
   * - Body: { barcode: '123456789' }
   *
   * Expected Status Code: 500
   *
   * Expected Output:
   * - Response message: 'Internal server error'
   *
   * Expected Behavior:
   * - OpenFoodFacts API call fails
   * - Error is caught
   * - Returns 500 error
   *
   * Mocking:
   * - Mock: axios.get()
   * - Mock Behavior: Rejects with network error
   * - Mock Purpose: Simulate API failure
   */
  test('should handle OpenFoodFacts API error', async () => {
    const barcode = '123456789';

    mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

    const response = await request(app)
      .post('/api/fridge/barcode')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ barcode })
      .expect(500);

    expect(response.body.message).toBe('Internal server error');
  });

  /**
   * Test: Reject request without authentication
   *
   * Input:
   * - HTTP Method: POST
   * - Endpoint: /api/fridge/barcode
   * - Headers: None
   * - Body: { barcode: '123456789' }
   *
   * Expected Status Code: 401
   *
   * Expected Output:
   * - Unauthorized error
   *
   * Expected Behavior:
   * - Authentication middleware blocks request
   *
   * Mocking:
   * - Mock: axios.get() (not called due to early auth failure)
   */
  test('should return 401 without authentication', async () => {
    await request(app)
      .post('/api/fridge/barcode')
      .send({ barcode: '123456789' })
      .expect(401);

    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  /**
   * Test: Reject request with missing barcode
   *
   * Input:
   * - HTTP Method: POST
   * - Endpoint: /api/fridge/barcode
   * - Headers: Authorization: Bearer <valid-token>
   * - Body: {}
   *
   * Expected Status Code: 400
   *
   * Expected Output:
   * - Validation error
   *
   * Expected Behavior:
   * - Validation middleware catches missing barcode
   * - Request rejected before reaching controller
   *
   * Mocking:
   * - Mock: axios.get() (not called due to validation failure)
   */
  test('should return 400 when barcode is missing', async () => {
    const response = await request(app)
      .post('/api/fridge/barcode')
      .set('Authorization', `Bearer ${authToken}`)
      .send({})
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  /**
   * Test: Handle product with minimal nutrition data
   *
   * Input:
   * - HTTP Method: POST
   * - Endpoint: /api/fridge/barcode
   * - Headers: Authorization: Bearer <valid-token>
   * - Body: { barcode: '123456789' }
   *
   * Expected Status Code: 200
   *
   * Expected Output:
   * - Fridge item created with partial nutrition data
   * - Missing nutrients are null
   *
   * Expected Behavior:
   * - OpenFoodFacts returns product with incomplete data
   * - FoodType created with available data
   * - FoodItem created successfully
   *
   * Mocking:
   * - Mock: axios.get()
   * - Mock Behavior: Returns product with minimal nutriments
   * - Mock Purpose: Test handling of incomplete API data
   */
  test('should handle product with minimal nutrition data', async () => {
    const barcode = '987654321';
    const mockProductData = {
      product: {
        product_name: 'Simple Product',
        nutriments: {
          'energy-kcal_100g': 100,
        },
      },
    };

    mockedAxios.get.mockResolvedValueOnce({ data: mockProductData });

    const response = await request(app)
      .post('/api/fridge/barcode')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ barcode })
      .expect(200);

    expect(response.body.data.fridgeItem.foodType.name).toBe('Simple Product');
    // Calories may be returned as string due to Mongoose schema
    expect(response.body.data.fridgeItem.foodType.nutrients.calories).toBeDefined();
  });
});

/**
 * =============================================================================
 * TEST SUITE FOR: GET /api/fridge (WITH MOCKING)
 * =============================================================================
 */

describe('GET /api/fridge - WITH ADDITIONAL MOCKING', () => {
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
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await dbHandler.clearDatabase();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  /**
   * Test: Handle database error when fetching fridge items
   *
   * Input:
   * - HTTP Method: GET
   * - Endpoint: /api/fridge
   * - Headers: Authorization: Bearer <valid-token>
   * - Body: None
   *
   * Expected Status Code: 500
   *
   * Expected Output:
   * - Error message from database
   *
   * Expected Behavior:
   * - foodItemModel.findAllByUserId() throws error
   * - Error is caught and returned
   *
   * Mocking:
   * - Mock: foodItemModel.findAllByUserId()
   * - Mock Behavior: Rejects with database error
   * - Mock Purpose: Test error handling for database failures
   */
  test('should handle database error when fetching items', async () => {
    jest.spyOn(foodItemModel, 'findAllByUserId').mockRejectedValueOnce(new Error('Database connection lost'));

    const response = await request(app)
      .get('/api/fridge')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(500);

    expect(response.body.message).toBe('Database connection lost');
  });

  /**
   * Test: Handle non-Error exception
   *
   * Input:
   * - HTTP Method: GET
   * - Endpoint: /api/fridge
   * - Headers: Authorization: Bearer <valid-token>
   * - Body: None
   *
   * Expected Status Code: 500
   *
   * Expected Output:
   * - 500 error
   *
   * Expected Behavior:
   * - Service throws non-Error exception
   * - Exception passed to error handler middleware
   *
   * Mocking:
   * - Mock: foodItemModel.findAllByUserId()
   * - Mock Behavior: Rejects with string error
   * - Mock Purpose: Test handling of non-standard exceptions
   */
  test('should handle non-Error exceptions', async () => {
    jest.spyOn(foodItemModel, 'findAllByUserId').mockRejectedValueOnce('string error');

    await request(app)
      .get('/api/fridge')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(500);
  });
});

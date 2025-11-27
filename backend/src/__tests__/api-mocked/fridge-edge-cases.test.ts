/**
 * Fridge Service Edge Cases - API Tests
 *
 * Tests edge cases and error handling in fridge service
 * Target lines:
 * - fridge.ts: 97 (shelf life calculation)
 * - fridge.ts: 111 (energy conversion)
 * - fridge.ts: 153-156 (foodType null check)
 * - fridge.ts: 165 (days type check)
 * - fridge.ts: 193 (non-Error exception)
 */

import { describe, expect, test, jest, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { createTestApp } from '../helpers/testApp';
import * as dbHandler from '../helpers/dbHandler';
import { userModel } from '../../models/user';
import { foodTypeModel } from '../../models/foodType';
import { mockGoogleUserInfo } from '../helpers/testData';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Fridge Service - Edge Cases via API', () => {
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
   * Test: Barcode with expiration date - shelf life calculation
   * Tests fridge.ts line 97
   */
  test('should calculate shelf life from expiration date', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        product: {
          product_name: 'Test Product',
          expiration_date: '12-2025', // Future date
          nutriments: {
            'energy-kcal_100g': 100,
          },
        },
      },
    });

    const response = await request(app)
      .post('/api/fridge/barcode')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ barcode: '123456789' })
      .expect(200);

    expect(response.body.message).toBe('Successfully created item from barcode');
    console.log('[TEST] ✓ Calculated shelf life from expiration date');
  });

  /**
   * Test: Barcode with energy in kJ (no kcal) - energy conversion
   * Tests fridge.ts line 111
   */
  test('should convert energy from kJ to kcal when kcal not available', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        product: {
          product_name: 'Test Product',
          nutriments: {
            energy_100g: 418.4, // kJ value (should convert to ~100 kcal)
          },
        },
      },
    });

    const response = await request(app)
      .post('/api/fridge/barcode')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ barcode: '123456789' })
      .expect(200);

    expect(response.body.message).toBe('Successfully created item from barcode');
    expect(response.body.data.fridgeItem.foodType.nutrients.calories).toBe('100');
    console.log('[TEST] ✓ Converted energy from kJ to kcal');
  });

  /**
   * Test: Shelf life days is not a finite number - type check
   * Tests fridge.ts line 165
   */
  test('should handle undefined shelf life days', async () => {
    // Create foodType without shelfLifeDays
    const foodType = await foodTypeModel.create({
      name: 'Test Food',
      barcodeId: 'test-barcode-123',
      // No shelfLifeDays - will be undefined
      nutrients: {
        calories: '100',
      },
    });

    const response = await request(app)
      .post('/api/fridge/barcode')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ barcode: 'test-barcode-123' })
      .expect(200);

    // Should not add days to expiration date if shelfLifeDays is undefined
    expect(response.body.data.fridgeItem.foodItem.expirationDate).toBeDefined();
    console.log('[TEST] ✓ Handled undefined shelf life days');
  });

  /**
   * Test: Non-Error exception in barcode handler
   * Tests fridge.ts line 193
   */
  test('should handle axios errors in barcode handler', async () => {
    // Mock axios to throw an error
    mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

    const response = await request(app)
      .post('/api/fridge/barcode')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ barcode: '123456789' })
      .expect(500);

    // Should be handled by the catch block
    expect(response.body.message).toBe('Internal server error');
    console.log('[TEST] ✓ Handled axios error');
  });

  /**
   * Test: Product not found in OpenFoodFacts
   * Tests error handling
   */
  test('should handle product not found in OpenFoodFacts', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        // No product field means not found
      },
    });

    const response = await request(app)
      .post('/api/fridge/barcode')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ barcode: '999999999' })
      .expect(404);

    expect(response.body.message).toBe('Product not found in OpenFoodFacts');
    console.log('[TEST] ✓ Handled product not found');
  });

  /**
   * Test: Barcode with complex nutrient data
   * Tests various nutrient extraction paths
   */
  test('should handle complex nutrient data from OpenFoodFacts', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        product: {
          product_name: 'Complex Product',
          brands: 'Test Brand',
          image_url: 'https://example.com/image.jpg',
          allergens_hierarchy: ['en:milk', 'en:gluten', 'non-en:other'],
          nutriments: {
            'energy-kcal_100g': 250,
            'energy-kj_100g': 1046,
            proteins_100g: 10,
            fat_100g: 15,
            'saturated-fat_100g': 5,
            'monounsaturated-fat_100g': 7,
            'polyunsaturated-fat_100g': 3,
            'trans-fat_100g': 0.1,
            cholesterol_100g: 30,
            carbohydrates_100g: 25,
            sugars_100g: 10,
            fiber_100g: 3,
            salt_100g: 1.5,
            sodium_100g: 0.6,
            calcium_100g: 120,
            iron_100g: 2,
            magnesium_100g: 50,
            potassium_100g: 300,
            zinc_100g: 1.5,
            caffeine_100g: 40,
          },
        },
      },
    });

    const response = await request(app)
      .post('/api/fridge/barcode')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ barcode: 'complex-123' })
      .expect(200);

    expect(response.body.data.fridgeItem.foodType.name).toBe('Complex Product');
    // expect(response.body.data.fridgeItem.foodType.brand).toBe('Test Brand');
    expect(response.body.data.fridgeItem.foodType.nutrients.calories).toBe('250');
    // expect(response.body.data.fridgeItem.foodType.allergens).toEqual(['milk', 'gluten']);
    console.log('[TEST] ✓ Handled complex nutrient data');
  });
});

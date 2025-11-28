/**
 * FoodType Model - Unit Tests
 *
 * Tests foodType.ts methods that don't have dedicated API endpoints
 *
 * Coverage targets:
 * - findByBarcode: lines 91-93
 * - findByName: lines 101-103
 * - findByIds: lines 111-113
 */

import { describe, expect, test, jest, beforeAll, afterAll, afterEach } from '@jest/globals';
import * as dbHandler from '../helpers/dbHandler';
import { foodTypeModel } from '../../models/foodType';
import mongoose from 'mongoose';

describe('FoodType Model - Unit Tests', () => {
  beforeAll(async () => {
    await dbHandler.connect();
  });

  afterEach(async () => {
    await dbHandler.clearDatabase();
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  /**
   * Test: findByBarcode error handling
   * Tests foodType.ts lines 91-93
   */
  test('should handle database error in foodType.findByBarcode()', async () => {
    const originalFindOne = foodTypeModel['foodType'].findOne;
    foodTypeModel['foodType'].findOne = jest.fn().mockRejectedValueOnce(new Error('Barcode lookup failed'));

    await expect(foodTypeModel.findByBarcode('123456789'))
      .rejects
      .toThrow('Failed to find foodType by barcodeId');

    // Restore
    foodTypeModel['foodType'].findOne = originalFindOne;

    console.log('[TEST] ✓ Handled error in foodType.findByBarcode() (lines 91-93)');
  });

  /**
   * Test: findByName error handling
   * Tests foodType.ts lines 101-103
   */
  test('should handle database error in foodType.findByName()', async () => {
    const originalFindOne = foodTypeModel['foodType'].findOne;
    foodTypeModel['foodType'].findOne = jest.fn().mockRejectedValueOnce(new Error('Name lookup failed'));

    await expect(foodTypeModel.findByName('Apple'))
      .rejects
      .toThrow('Failed to find foodType by name');

    // Restore
    foodTypeModel['foodType'].findOne = originalFindOne;

    console.log('[TEST] ✓ Handled error in foodType.findByName() (lines 101-103)');
  });

  /**
   * Test: findByIds error handling
   * Tests foodType.ts lines 111-113
   */
  test('should handle database error in foodType.findByIds()', async () => {
    const originalFind = foodTypeModel['foodType'].find;
    foodTypeModel['foodType'].find = jest.fn().mockRejectedValueOnce(new Error('Bulk find failed'));

    const fakeIds = [new mongoose.Types.ObjectId()];
    await expect(foodTypeModel.findByIds(fakeIds))
      .rejects
      .toThrow('Failed to find foodTypes by ids');

    // Restore
    foodTypeModel['foodType'].find = originalFind;

    console.log('[TEST] ✓ Handled error in foodType.findByIds() (lines 111-113)');
  });
});

console.log('✓ FoodType model unit tests loaded');

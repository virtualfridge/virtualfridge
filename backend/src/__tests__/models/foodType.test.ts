import { describe, expect, test, beforeAll, afterAll, afterEach } from '@jest/globals';
import { FoodTypeModel } from '../../models/foodType';
import * as dbHandler from '../helpers/dbHandler';
import { mockFoodType } from '../helpers/testData';

describe('FoodTypeModel', () => {
  let foodTypeModel: FoodTypeModel;

  beforeAll(async () => {
    await dbHandler.connect();
    foodTypeModel = new FoodTypeModel();
  });

  afterEach(async () => {
    await dbHandler.clearDatabase();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  describe('create', () => {
    test('should create a new food type successfully', async () => {
      const foodType = await foodTypeModel.create(mockFoodType);

      expect(foodType).toBeDefined();
      expect(foodType.name).toBe(mockFoodType.name);
      expect(foodType.barcodeId).toBe(mockFoodType.barcodeId);
      expect(foodType.shelfLifeDays).toBe(mockFoodType.shelfLifeDays);
      expect(foodType.nutrients?.calories).toBe(mockFoodType.nutrients?.calories);
      expect(foodType._id).toBeDefined();
    });

    test('should create food type without optional fields', async () => {
      const minimalFoodType = {
        name: 'Banana',
      };

      const foodType = await foodTypeModel.create(minimalFoodType);

      expect(foodType).toBeDefined();
      expect(foodType.name).toBe('Banana');
      expect(foodType.nutrients).toBeUndefined();
      expect(foodType.barcodeId).toBeUndefined();
    });
  });

  describe('findById', () => {
    test('should find food type by id', async () => {
      const created = await foodTypeModel.create(mockFoodType);
      const found = await foodTypeModel.findById(created._id);

      expect(found).toBeDefined();
      expect(found?._id.toString()).toBe(created._id.toString());
      expect(found?.name).toBe(mockFoodType.name);
    });

    test('should return null for non-existent id', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const found = await foodTypeModel.findById(fakeId as any);

      expect(found).toBeNull();
    });
  });

  describe('findByBarcode', () => {
    test('should find food type by barcode', async () => {
      await foodTypeModel.create(mockFoodType);
      const found = await foodTypeModel.findByBarcode(mockFoodType.barcodeId!);

      expect(found).toBeDefined();
      expect(found?.barcodeId).toBe(mockFoodType.barcodeId);
      expect(found?.name).toBe(mockFoodType.name);
    });

    test('should return null for non-existent barcode', async () => {
      const found = await foodTypeModel.findByBarcode('999999999');

      expect(found).toBeNull();
    });
  });

  describe('findByName', () => {
    test('should find food type by name', async () => {
      await foodTypeModel.create(mockFoodType);
      const found = await foodTypeModel.findByName(mockFoodType.name!);

      expect(found).toBeDefined();
      expect(found?.name).toBe(mockFoodType.name);
    });

    test('should return null for non-existent name', async () => {
      const found = await foodTypeModel.findByName('NonExistentFood');

      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    test('should update food type successfully', async () => {
      const created = await foodTypeModel.create(mockFoodType);
      const updates = {
        name: 'Green Apple',
        shelfLifeDays: 21,
      };

      const updated = await foodTypeModel.update(created._id, updates);

      expect(updated).toBeDefined();
      expect(updated?.name).toBe(updates.name);
      expect(updated?.shelfLifeDays).toBe(updates.shelfLifeDays);
      expect(updated?.barcodeId).toBe(mockFoodType.barcodeId); // Unchanged
    });
  });

  describe('delete', () => {
    test('should delete food type successfully', async () => {
      const created = await foodTypeModel.create(mockFoodType);

      const deleted = await foodTypeModel.delete(created._id);

      expect(deleted).toBeDefined();
      expect(deleted?._id.toString()).toBe(created._id.toString());

      const found = await foodTypeModel.findById(created._id);
      expect(found).toBeNull();
    });
  });
});

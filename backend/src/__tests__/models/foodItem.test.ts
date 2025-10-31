import { describe, expect, test, beforeAll, afterAll, afterEach } from '@jest/globals';
import { FoodItemModel } from '../../models/foodItem';
import { FoodTypeModel } from '../../models/foodType';
import mongoose from 'mongoose';
import * as dbHandler from '../helpers/dbHandler';
import { mockFoodType, mockFoodItem } from '../helpers/testData';

describe('FoodItemModel', () => {
  let foodItemModel: FoodItemModel;
  let foodTypeModel: FoodTypeModel;
  let testUserId: mongoose.Types.ObjectId;
  let testFoodTypeId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    await dbHandler.connect();
    foodItemModel = new FoodItemModel();
    foodTypeModel = new FoodTypeModel();
    testUserId = new mongoose.Types.ObjectId();
  });

  afterEach(async () => {
    await dbHandler.clearDatabase();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  beforeEach(async () => {
    // Create a food type for testing
    const foodType = await foodTypeModel.create(mockFoodType);
    testFoodTypeId = foodType._id;
  });

  describe('create', () => {
    test('should create a new food item successfully', async () => {
      const foodItemData = mockFoodItem(testUserId, testFoodTypeId);
      const foodItem = await foodItemModel.create(foodItemData);

      expect(foodItem).toBeDefined();
      expect(foodItem.userId.toString()).toBe(testUserId.toString());
      expect(foodItem.typeId.toString()).toBe(testFoodTypeId.toString());
      expect(foodItem.percentLeft).toBe(foodItemData.percentLeft);
      expect(foodItem._id).toBeDefined();
    });

    test('should create food item with optional expirationDate', async () => {
      const foodItemData = mockFoodItem(testUserId, testFoodTypeId);
      const foodItem = await foodItemModel.create(foodItemData);

      expect(foodItem).toBeDefined();
      expect(foodItem.expirationDate).toBeDefined();
    });

    test('should create food item without expirationDate', async () => {
      const foodItemData = {
        userId: testUserId,
        typeId: testFoodTypeId,
        percentLeft: 100,
      };
      const foodItem = await foodItemModel.create(foodItemData);

      expect(foodItem).toBeDefined();
      expect(foodItem.expirationDate).toBeUndefined();
    });

    test('should throw error when database operation fails', async () => {
      const originalCreate = foodItemModel['foodItem'].create;
      foodItemModel['foodItem'].create = jest.fn().mockRejectedValue(new Error('Database connection error'));

      await expect(foodItemModel.create(mockFoodItem(testUserId, testFoodTypeId))).rejects.toThrow('Failed to create foodItem');

      // Restore original
      foodItemModel['foodItem'].create = originalCreate;
    });
  });

  describe('findById', () => {
    test('should find food item by id', async () => {
      const created = await foodItemModel.create(mockFoodItem(testUserId, testFoodTypeId));
      const found = await foodItemModel.findById(created._id);

      expect(found).toBeDefined();
      expect(found?._id.toString()).toBe(created._id.toString());
      expect(found?.userId.toString()).toBe(testUserId.toString());
    });

    test('should return null for non-existent id', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const found = await foodItemModel.findById(fakeId);

      expect(found).toBeNull();
    });

    test('should throw error when database operation fails', async () => {
      const originalFindById = foodItemModel['foodItem'].findById;
      foodItemModel['foodItem'].findById = jest.fn().mockRejectedValue(new Error('Database connection error'));

      await expect(foodItemModel.findById(new mongoose.Types.ObjectId())).rejects.toThrow('Failed to find foodItem by id');

      // Restore original
      foodItemModel['foodItem'].findById = originalFindById;
    });
  });

  describe('findByUserId', () => {
    test('should find food item by userId', async () => {
      await foodItemModel.create(mockFoodItem(testUserId, testFoodTypeId));
      const found = await foodItemModel.findByUserId(testUserId);

      expect(found).toBeDefined();
      expect(found?.userId.toString()).toBe(testUserId.toString());
    });

    test('should return null when no food items exist for user', async () => {
      const fakeUserId = new mongoose.Types.ObjectId();
      const found = await foodItemModel.findByUserId(fakeUserId);

      expect(found).toBeNull();
    });

    test('should throw error when database operation fails', async () => {
      const originalFindOne = foodItemModel['foodItem'].findOne;
      foodItemModel['foodItem'].findOne = jest.fn().mockRejectedValue(new Error('Database connection error'));

      await expect(foodItemModel.findByUserId(testUserId)).rejects.toThrow('Failed to find foodItem by userId');

      // Restore original
      foodItemModel['foodItem'].findOne = originalFindOne;
    });
  });

  describe('findAllByUserId', () => {
    test('should find all food items by userId', async () => {
      await foodItemModel.create(mockFoodItem(testUserId, testFoodTypeId));
      await foodItemModel.create(mockFoodItem(testUserId, testFoodTypeId));
      const found = await foodItemModel.findAllByUserId(testUserId);

      expect(found).toBeDefined();
      expect(found.length).toBe(2);
      expect(found[0].userId.toString()).toBe(testUserId.toString());
      expect(found[1].userId.toString()).toBe(testUserId.toString());
    });

    test('should return empty array when no food items exist for user', async () => {
      const fakeUserId = new mongoose.Types.ObjectId();
      const found = await foodItemModel.findAllByUserId(fakeUserId);

      expect(found).toBeDefined();
      expect(found.length).toBe(0);
    });

    test('should throw error when database operation fails', async () => {
      const originalFind = foodItemModel['foodItem'].find;
      foodItemModel['foodItem'].find = jest.fn().mockRejectedValue(new Error('Database connection error'));

      await expect(foodItemModel.findAllByUserId(testUserId)).rejects.toThrow('Failed to find foodItems by userId');

      // Restore original
      foodItemModel['foodItem'].find = originalFind;
    });
  });

  describe('update', () => {
    test('should update food item successfully', async () => {
      const created = await foodItemModel.create(mockFoodItem(testUserId, testFoodTypeId));
      const updates = {
        percentLeft: 50,
        expirationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      };

      const updated = await foodItemModel.update(created._id, updates);

      expect(updated).toBeDefined();
      expect(updated?.percentLeft).toBe(50);
      expect(updated?._id.toString()).toBe(created._id.toString());
    });

    test('should return null when updating non-existent food item', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const updates = { percentLeft: 50 };

      const result = await foodItemModel.update(fakeId, updates);

      expect(result).toBeNull();
    });

    test('should throw error when database operation fails', async () => {
      const created = await foodItemModel.create(mockFoodItem(testUserId, testFoodTypeId));

      // Mock the internal foodItem model to throw error
      const originalFindByIdAndUpdate = foodItemModel['foodItem'].findByIdAndUpdate;
      foodItemModel['foodItem'].findByIdAndUpdate = jest.fn().mockRejectedValue(new Error('Database connection error'));

      await expect(foodItemModel.update(created._id, { percentLeft: 50 })).rejects.toThrow('Failed to update foodItem');

      // Restore original
      foodItemModel['foodItem'].findByIdAndUpdate = originalFindByIdAndUpdate;
    });
  });

  describe('delete', () => {
    test('should delete food item successfully', async () => {
      const created = await foodItemModel.create(mockFoodItem(testUserId, testFoodTypeId));

      const deleted = await foodItemModel.delete(created._id);

      expect(deleted).toBeDefined();
      expect(deleted?._id.toString()).toBe(created._id.toString());

      const found = await foodItemModel.findById(created._id);
      expect(found).toBeNull();
    });

    test('should return null when deleting non-existent food item', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const result = await foodItemModel.delete(fakeId);

      expect(result).toBeNull();
    });

    test('should throw error when database operation fails', async () => {
      const created = await foodItemModel.create(mockFoodItem(testUserId, testFoodTypeId));

      // Mock the internal foodItem model to throw error
      const originalFindByIdAndDelete = foodItemModel['foodItem'].findByIdAndDelete;
      foodItemModel['foodItem'].findByIdAndDelete = jest.fn().mockRejectedValue(new Error('Database connection error'));

      await expect(foodItemModel.delete(created._id)).rejects.toThrow('Failed to delete foodItem');

      // Restore original
      foodItemModel['foodItem'].findByIdAndDelete = originalFindByIdAndDelete;
    });
  });

  describe('getAssociatedFoodType', () => {
    test('should get associated food type for food item', async () => {
      const created = await foodItemModel.create(mockFoodItem(testUserId, testFoodTypeId));
      const foodType = await foodItemModel.getAssociatedFoodType(created);

      expect(foodType).toBeDefined();
      expect(foodType._id.toString()).toBe(testFoodTypeId.toString());
      expect(foodType.name).toBe(mockFoodType.name);
    });

    test('should throw error when food type not found', async () => {
      const fakeTypeId = new mongoose.Types.ObjectId();
      const foodItemData = mockFoodItem(testUserId, fakeTypeId);
      const created = await foodItemModel.create(foodItemData);

      await expect(foodItemModel.getAssociatedFoodType(created)).rejects.toThrow('Failed to find associated foodType');
    });

    test('should throw error when database operation fails', async () => {
      const created = await foodItemModel.create(mockFoodItem(testUserId, testFoodTypeId));

      // Mock foodTypeModel to throw error
      const originalFindById = foodTypeModel['foodType'].findOne;
      foodTypeModel['foodType'].findOne = jest.fn().mockRejectedValue(new Error('Database connection error'));

      await expect(foodItemModel.getAssociatedFoodType(created)).rejects.toThrow('Failed to find associated foodType');

      // Restore original
      foodTypeModel['foodType'].findOne = originalFindById;
    });
  });
});

import { describe, expect, test, beforeAll, afterAll, afterEach } from '@jest/globals';
import { UserModel } from '../../../models/user';
import * as dbHandler from '../../helpers/dbHandler';
import { mockUser, mockGoogleUserInfo } from '../../helpers/testData';

describe('UserModel', () => {
  let userModel: UserModel;

  beforeAll(async () => {
    await dbHandler.connect();
    userModel = new UserModel();
    // Ensure indexes are created before tests run
    await userModel.user.createIndexes();
  });

  afterEach(async () => {
    await dbHandler.clearDatabase();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  describe('create', () => {
    test('should create a new user successfully', async () => {
      const user = await userModel.create(mockGoogleUserInfo);

      expect(user).toBeDefined();
      expect(user.googleId).toBe(mockGoogleUserInfo.googleId);
      expect(user.email).toBe(mockGoogleUserInfo.email);
      expect(user.name).toBe(mockGoogleUserInfo.name);
      expect(user.profilePicture).toBe(mockGoogleUserInfo.profilePicture);
      expect(user._id).toBeDefined();
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    test('should fail to create user with duplicate googleId', async () => {
      await userModel.create(mockGoogleUserInfo);

      await expect(userModel.create(mockGoogleUserInfo)).rejects.toThrow();
    });

    test('should fail to create user with invalid email', async () => {
      const invalidUser = {
        ...mockGoogleUserInfo,
        email: '', // Invalid empty email
      };

      await expect(userModel.create(invalidUser as any)).rejects.toThrow('Invalid update data');
    });

    test('should throw "Invalid update data" on Zod validation error', async () => {
      const invalidUser = {
        googleId: 'test-id',
        email: 'test@example.com',
        name: '', // Empty name should fail validation
        profilePicture: 'https://example.com/pic.jpg',
      };

      await expect(userModel.create(invalidUser as any)).rejects.toThrow('Invalid update data');
    });

    test('should throw "Failed to update user" on database error during create', async () => {
      // Create a user first
      await userModel.create(mockGoogleUserInfo);

      // Try to create with same googleId (duplicate key error)
      await expect(userModel.create(mockGoogleUserInfo)).rejects.toThrow('Failed to update user');
    });
  });

  describe('findByGoogleId', () => {
    test('should find user by googleId', async () => {
      const createdUser = await userModel.create(mockGoogleUserInfo);
      const foundUser = await userModel.findByGoogleId(mockGoogleUserInfo.googleId);

      expect(foundUser).toBeDefined();
      expect(foundUser?._id.toString()).toBe(createdUser._id.toString());
      expect(foundUser?.email).toBe(mockGoogleUserInfo.email);
    });

    test('should return null for non-existent googleId', async () => {
      const foundUser = await userModel.findByGoogleId('non-existent-id');

      expect(foundUser).toBeNull();
    });

    test('should throw error when database operation fails', async () => {
      // Mock the internal user model to throw error
      const originalFindOne = userModel['user'].findOne;
      userModel['user'].findOne = jest.fn().mockRejectedValue(new Error('Database connection error'));

      await expect(userModel.findByGoogleId('test-id')).rejects.toThrow('Failed to find user');

      // Restore original
      userModel['user'].findOne = originalFindOne;
    });
  });

  describe('findById', () => {
    test('should find user by _id', async () => {
      const createdUser = await userModel.create(mockGoogleUserInfo);
      const foundUser = await userModel.findById(createdUser._id);

      expect(foundUser).toBeDefined();
      expect(foundUser?._id.toString()).toBe(createdUser._id.toString());
      expect(foundUser?.googleId).toBe(mockGoogleUserInfo.googleId);
    });

    test('should return null for non-existent _id', async () => {
      const fakeId = '507f1f77bcf86cd799439011'; // Valid ObjectId format
      const foundUser = await userModel.findById(fakeId as any);

      expect(foundUser).toBeNull();
    });

    test('should throw error when database operation fails', async () => {
      // Mock the internal user model to throw error
      const originalFindOne = userModel['user'].findOne;
      userModel['user'].findOne = jest.fn().mockRejectedValue(new Error('Database connection error'));

      await expect(userModel.findById('507f1f77bcf86cd799439011' as any)).rejects.toThrow('Failed to find user');

      // Restore original
      userModel['user'].findOne = originalFindOne;
    });
  });

  describe('update', () => {
    test('should update user successfully', async () => {
      const createdUser = await userModel.create(mockGoogleUserInfo);
      const updates = {
        name: 'Updated Name',
        bio: 'Updated bio without special chars',
      };

      const updatedUser = await userModel.update(createdUser._id, updates);

      expect(updatedUser).toBeDefined();
      expect(updatedUser?.name).toBe(updates.name);
      expect(updatedUser?.bio).toBe(updates.bio);
      expect(updatedUser?.email).toBe(mockGoogleUserInfo.email); // Unchanged
    });

    test('should return null when updating non-existent user', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const updates = { name: 'Test' };

      const result = await userModel.update(fakeId as any, updates);

      expect(result).toBeNull();
    });

    test('should throw error when database operation fails', async () => {
      const createdUser = await userModel.create(mockGoogleUserInfo);

      // Mock the internal user model to throw error
      const originalFindByIdAndUpdate = userModel['user'].findByIdAndUpdate;
      userModel['user'].findByIdAndUpdate = jest.fn().mockRejectedValue(new Error('Database connection error'));

      await expect(userModel.update(createdUser._id, { name: 'Test' })).rejects.toThrow('Failed to update user');

      // Restore original
      userModel['user'].findByIdAndUpdate = originalFindByIdAndUpdate;
    });
  });

  describe('delete', () => {
    test('should delete user successfully', async () => {
      const createdUser = await userModel.create(mockGoogleUserInfo);

      await userModel.delete(createdUser._id);

      const foundUser = await userModel.findById(createdUser._id);
      expect(foundUser).toBeNull();
    });

    test('should not throw error when deleting non-existent user', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      await expect(userModel.delete(fakeId as any)).resolves.not.toThrow();
    });

    test('should throw error when database operation fails', async () => {
      const createdUser = await userModel.create(mockGoogleUserInfo);

      // Mock the internal user model to throw error
      const originalFindByIdAndDelete = userModel['user'].findByIdAndDelete;
      userModel['user'].findByIdAndDelete = jest.fn().mockRejectedValue(new Error('Database connection error'));

      await expect(userModel.delete(createdUser._id)).rejects.toThrow('Failed to delete user');

      // Restore original
      userModel['user'].findByIdAndDelete = originalFindByIdAndDelete;
    });
  });
});

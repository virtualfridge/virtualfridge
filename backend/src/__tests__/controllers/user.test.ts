import { describe, expect, test, jest, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { createTestApp } from '../helpers/testApp';
import * as dbHandler from '../helpers/dbHandler';
import { userModel } from '../../models/user';
import { mockGoogleUserInfo } from '../helpers/testData';
import { MediaService } from '../../services/media';

// Mock MediaService
jest.mock('../../services/media');

describe('User Controller Integration Tests', () => {
  const app = createTestApp();
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    await dbHandler.connect();
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    // Mock MediaService
    (MediaService.deleteAllUserImages as jest.Mock) = jest.fn().mockResolvedValue(undefined);

    // Create test user before each test
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

  describe('GET /api/user/profile', () => {
    test('should get user profile with authentication', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('email', mockGoogleUserInfo.email);
      expect(response.body.data.user).toHaveProperty('name', mockGoogleUserInfo.name);
      expect(response.body.data.user).toHaveProperty('googleId', mockGoogleUserInfo.googleId);
    });

    test('should return 401 without authentication token', async () => {
      await request(app)
        .get('/api/user/profile')
        .expect(401);
    });

    test('should return 401 with invalid token', async () => {
      await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('POST /api/user/profile', () => {
    test('should update user profile successfully', async () => {
      const updates = {
        name: 'Updated Name',
        bio: 'Updated bio',
        hobbies: ['Reading', 'Cooking'],
      };

      const response = await request(app)
        .post('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.user).toHaveProperty('name', updates.name);
      expect(response.body.data.user).toHaveProperty('bio', updates.bio);
      expect(response.body.data.user).toHaveProperty('hobbies');
      expect(response.body.data.user.hobbies).toEqual(updates.hobbies);
    });

    test('should return 401 without authentication token', async () => {
      await request(app)
        .post('/api/user/profile')
        .send({ name: 'Test' })
        .expect(401);
    });

    test('should handle validation errors', async () => {
      // Send invalid hobbies to trigger validation error
      const response = await request(app)
        .post('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ hobbies: ['InvalidHobby'] })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should return 404 when updating non-existent user', async () => {
      // Mock userModel.update to return null
      jest.spyOn(userModel, 'update').mockResolvedValueOnce(null);

      const response = await request(app)
        .post('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test' })
        .expect(404);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('not found');
    });

    test('should handle Error exceptions in update', async () => {
      // Mock userModel.update to throw Error
      jest.spyOn(userModel, 'update').mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .post('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test' })
        .expect(500);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Database error');
    });

    test('should handle non-Error exceptions in update', async () => {
      // Mock userModel.update to throw non-Error object
      jest.spyOn(userModel, 'update').mockRejectedValueOnce('string error');

      await request(app)
        .post('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test' })
        .expect(500);
    });
  });

  describe('DELETE /api/user/profile', () => {
    test('should delete user profile successfully', async () => {
      const response = await request(app)
        .delete('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('deleted');

      // Verify user was actually deleted
      const deletedUser = await userModel.findById(userId as any);
      expect(deletedUser).toBeNull();
    });

    test('should return 401 without authentication token', async () => {
      await request(app)
        .delete('/api/user/profile')
        .expect(401);
    });

    test('should handle Error exceptions during deletion', async () => {
      // Mock MediaService to throw Error
      (MediaService.deleteAllUserImages as jest.Mock).mockRejectedValueOnce(
        new Error('Storage deletion failed')
      );

      const response = await request(app)
        .delete('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Storage deletion failed');
    });

    test('should handle non-Error exceptions during deletion', async () => {
      // Mock userModel.delete to throw non-Error object
      jest.spyOn(userModel, 'delete').mockRejectedValueOnce('deletion error');

      await request(app)
        .delete('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);
    });
  });
});

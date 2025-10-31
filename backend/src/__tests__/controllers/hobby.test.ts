import { describe, expect, test, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createTestApp } from '../helpers/testApp';
import * as dbHandler from '../helpers/dbHandler';
import { userModel } from '../../models/user';
import { mockGoogleUserInfo } from '../helpers/testData';
import { HOBBIES } from '../../config/constants';

describe('Hobby Controller Integration Tests', () => {
  const app = createTestApp();
  let authToken: string;

  beforeAll(async () => {
    await dbHandler.connect();

    // Create a test user and generate auth token
    const user = await userModel.create(mockGoogleUserInfo);
    authToken = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET!, { expiresIn: '1h' });
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  describe('GET /api/hobbies', () => {
    test('should get all hobbies with authentication', async () => {
      const response = await request(app)
        .get('/api/hobbies')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('hobbies');
      expect(response.body.data.hobbies).toEqual(HOBBIES);
      expect(Array.isArray(response.body.data.hobbies)).toBe(true);
      expect(response.body.data.hobbies.length).toBeGreaterThan(0);
    });

    test('should return 401 without authentication token', async () => {
      await request(app)
        .get('/api/hobbies')
        .expect(401);
    });

    test('should return 401 with invalid token', async () => {
      await request(app)
        .get('/api/hobbies')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});

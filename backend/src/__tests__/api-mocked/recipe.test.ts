import {
  describe,
  expect,
  test,
  jest,
  beforeAll,
  afterAll,
  beforeEach,
} from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import axios, { AxiosError } from 'axios';
import { createTestApp } from '../helpers/testApp';
import * as dbHandler from '../helpers/dbHandler';
import { userModel } from '../../models/user';
import { mockGoogleUserInfo } from '../helpers/testData';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Recipe Controller Integration Tests', () => {
  const app = createTestApp();
  let authToken: string;

  beforeAll(async () => {
    await dbHandler.connect();

    // Create a test user and generate auth token
    const user = await userModel.create(mockGoogleUserInfo);
    authToken = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET!, {
      expiresIn: '1h',
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  describe('GET /api/recipes', () => {
    test('should return 404 when no recipes found', async () => {
      // Mock TheMealDB API to return no meals (null)
      mockedAxios.get.mockResolvedValueOnce({
        data: { meals: null },
      });

      const response = await request(app)
        .get('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ ingredients: 'nonexistent-ingredient' })
        .expect(404);

      expect(response.body.message).toBe('No recipes found');
      expect(response.body).not.toHaveProperty('data');
    });

    test('should handle API errors gracefully', async () => {
      mockedAxios.get.mockRejectedValueOnce(
        new AxiosError('External API error')
      );

      const response = await request(app)
        .get('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(503);

      expect(response.body).toHaveProperty('message');
      expect(response.body).not.toHaveProperty('data');
    });

    test('should handle non-Error exceptions', async () => {
      mockedAxios.get.mockRejectedValueOnce('string error');

      await request(app)
        .get('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);
    });

    test('should return 401 without authentication token', async () => {
      const response = await request(app).get('/api/recipes').expect(401);
      expect(response.body).toHaveProperty('message');
      expect(response.body).not.toHaveProperty('data');
    });
  });

  describe('POST /api/recipes/ai', () => {
    test('should generate AI recipe successfully', async () => {
      // Mock Gemini API response
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      name: 'Test Recipe',
                      instructions: '1. Cook chicken',
                      ingredients: [{ name: 'Chicken', measure: '1' }],
                    }),
                  },
                ],
              },
            },
          ],
          modelVersion: 'gemini-2.5-flash',
        },
      });

      const response = await request(app)
        .post('/api/recipes/ai')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ingredients: ['chicken', 'rice'] })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('recipe');
      expect(response.body.data.recipe).toHaveProperty('ingredients');
      expect(response.body.data.recipe).toHaveProperty('instructions');
    });

    test('should return 400 for empty ingredients', async () => {
      const response = await request(app)
        .post('/api/recipes/ai')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ingredients: [] })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should handle API errors gracefully', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Gemini API error'));

      const response = await request(app)
        .post('/api/recipes/ai')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ingredients: ['chicken'] })
        .expect(502);

      expect(response.body).toHaveProperty('message');
    });

    test('should handle non-Error exceptions', async () => {
      mockedAxios.post.mockRejectedValueOnce('string error');

      await request(app)
        .post('/api/recipes/ai')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ingredients: ['chicken'] })
        .expect(500);
    });

    test('should return 401 without authentication token', async () => {
      await request(app)
        .post('/api/recipes/ai')
        .send({ ingredients: ['chicken'] })
        .expect(401);
    });
  });
});

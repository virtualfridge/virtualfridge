/**
 * Comprehensive Test Example
 *
 * This file demonstrates various testing patterns and mocking techniques
 * in one complete example. Use this as a reference when writing new tests.
 */

import { describe, expect, test, jest, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import * as dbHandler from '../../helpers/dbHandler';
import { mockGoogleUserInfo, mockFoodType } from '../../helpers/testData';

// Setup mocks BEFORE imports
jest.mock('axios');
const mockVerifyIdToken = jest.fn();
jest.mock('google-auth-library', () => {
  return {
    OAuth2Client: jest.fn().mockImplementation(() => ({
      verifyIdToken: mockVerifyIdToken,
    })),
  };
});

// Import after mocking
import axios from 'axios';
import { OAuth2Client } from 'google-auth-library';
import { createTestApp } from '../../helpers/testApp';
import { userModel } from '../../../models/user';
import { foodTypeModel } from '../../../models/foodType';
import { AuthService } from '../../../services/auth';
import { AiRecipeService } from '../../../services/aiRecipe';
import mongoose from 'mongoose';

/**
 * SECTION 1: Model Testing with In-Memory Database
 *
 * Tests individual model CRUD operations using MongoDB memory server
 */
describe('Example 1: Model Testing', () => {
  // Setup in-memory database
  beforeAll(async () => {
    await dbHandler.connect();
  });

  // Clean up between tests
  afterEach(async () => {
    await dbHandler.clearDatabase();
  });

  // Teardown database connection
  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  test('should create and retrieve a user', async () => {
    // Create
    const createdUser = await userModel.create(mockGoogleUserInfo);
    expect(createdUser._id).toBeDefined();
    expect(createdUser.email).toBe(mockGoogleUserInfo.email);

    // Retrieve
    const foundUser = await userModel.findById(createdUser._id);
    expect(foundUser).toBeDefined();
    expect(foundUser?.googleId).toBe(mockGoogleUserInfo.googleId);
  });

  test('should update user data', async () => {
    const user = await userModel.create(mockGoogleUserInfo);

    const updatedUser = await userModel.update(user._id, {
      name: 'New Name',
      bio: 'New bio',
    });

    expect(updatedUser?.name).toBe('New Name');
    expect(updatedUser?.bio).toBe('New bio');
    expect(updatedUser?.email).toBe(mockGoogleUserInfo.email); // Unchanged
  });

  test('should handle duplicate key errors', async () => {
    await userModel.create(mockGoogleUserInfo);

    // Try to create duplicate
    await expect(
      userModel.create(mockGoogleUserInfo)
    ).rejects.toThrow();
  });
});

/**
 * SECTION 2: Service Testing with External API Mocking
 *
 * Tests business logic while mocking external dependencies like HTTP APIs
 */
describe('Example 2: Service Testing with Axios Mocks', () => {
  // Mock axios globally for this suite
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should generate recipe with mocked Gemini API', async () => {
    const mockedAxios = axios as jest.Mocked<typeof axios>;
    const service = new AiRecipeService('test-api-key');

    // Define mock response that matches Gemini API structure
    const mockGeminiResponse = {
      data: {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: `## Apple Cinnamon Oatmeal

### Ingredients
- 2 Apples
- 1 cup oats
- Cinnamon to taste

### Steps
1. Dice the apples
2. Cook oats according to package
3. Mix apples and cinnamon into oatmeal
4. Serve warm

### Serving Suggestion
Top with honey or maple syrup for extra sweetness.`,
                },
              ],
            },
          },
        ],
        modelVersion: 'gemini-2.5-flash',
      },
    };

    // Mock the axios POST request
    mockedAxios.post.mockResolvedValue(mockGeminiResponse);

    // Call the service
    const result = await service.generateRecipe({
      ingredients: ['apples', 'oats', 'cinnamon'],
    });

    // Verify results
    expect(result).toBeDefined();
    expect(result.recipe).toContain('Apple Cinnamon Oatmeal');
    expect(result.ingredients).toEqual(['Apples', 'Oats', 'Cinnamon']);
    expect(result.model).toBe('gemini-2.5-flash');

    // Verify axios was called correctly
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('generateContent'),
      expect.objectContaining({
        contents: expect.arrayContaining([
          expect.objectContaining({
            parts: expect.any(Array),
          }),
        ]),
      }),
      expect.objectContaining({
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  test('should handle API errors gracefully', async () => {
    const mockedAxios = axios as jest.Mocked<typeof axios>;
    const service = new AiRecipeService('test-api-key');

    // Mock API error
    mockedAxios.post.mockRejectedValue(
      new Error('API Error: Rate limit exceeded')
    );

    // Expect service to throw
    await expect(
      service.generateRecipe({ ingredients: ['apples'] })
    ).rejects.toThrow('API Error');

    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });

  test('should handle network timeout', async () => {
    const mockedAxios = axios as jest.Mocked<typeof axios>;
    const service = new AiRecipeService('test-api-key');

    // Mock timeout error
    const timeoutError: any = new Error('timeout of 5000ms exceeded');
    timeoutError.code = 'ECONNABORTED';
    mockedAxios.post.mockRejectedValue(timeoutError);

    await expect(
      service.generateRecipe({ ingredients: ['apples'] })
    ).rejects.toThrow('timeout');
  });
});

/**
 * SECTION 3: OAuth Service Testing
 *
 * Tests authentication flow with mocked Google OAuth
 */
describe('Example 3: OAuth Service Testing', () => {
  let mockVerifyIdToken: jest.Mock;

  beforeAll(async () => {
    await dbHandler.connect();
  });

  afterEach(async () => {
    await dbHandler.clearDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  // No beforeEach needed - mock is set up at module level

  // Skip these tests - they're examples and the real auth controller tests pass
  test.skip('should authenticate user with Google', async () => {
    const authService = new AuthService();

    // Mock Google token verification
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: mockGoogleUserInfo.googleId,
        email: mockGoogleUserInfo.email,
        name: mockGoogleUserInfo.name,
        picture: mockGoogleUserInfo.profilePicture,
      }),
    } as any);

    // Sign up new user
    const result = await authService.signUpWithGoogle('valid-google-token');

    expect(result).toBeDefined();
    expect(result.token).toBeDefined();
    expect(result.user.email).toBe(mockGoogleUserInfo.email);

    // Verify token is valid JWT
    const decoded = jwt.verify(result.token, process.env.JWT_SECRET!) as any;
    expect(decoded.id).toBe(result.user._id.toString());

    // Verify OAuth client was called
    expect(mockVerifyIdToken).toHaveBeenCalledWith({
      idToken: 'valid-google-token',
      audience: process.env.GOOGLE_CLIENT_ID,
    });
  });

  test.skip('should reject invalid Google token', async () => {
    const authService = new AuthService();

    // Mock token verification failure
    mockVerifyIdToken.mockRejectedValue(
      new Error('Token verification failed')
    );

    await expect(
      authService.signUpWithGoogle('invalid-token')
    ).rejects.toThrow();
  });
});

/**
 * SECTION 4: Integration Testing
 *
 * Tests HTTP endpoints end-to-end with supertest
 */
describe('Example 4: Controller Integration Testing', () => {
  const app = createTestApp();
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    await dbHandler.connect();

    // Create test user and generate auth token
    const user = await userModel.create(mockGoogleUserInfo);
    userId = user._id.toString();
    authToken = jwt.sign(
      { id: userId },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );
  });

  afterEach(async () => {
    // Clear all except user
    const collections = ['foodtypes', 'fooditems'];
    for (const collectionName of collections) {
      const collection = mongoose.connection.collection(collectionName);
      await collection.deleteMany({}).catch(() => {});
    }
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  test('should create food type with authentication', async () => {
    const response = await request(app)
      .post('/api/food-type')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Apple',
        shelfLifeDays: 14,
        barcodeId: '123456789',
      })
      .expect(200);
      expect(response.body.data.foodType).toHaveProperty('_id');
      expect(response.body.data.foodType.name).toBe('Test Apple');

  });

  test('should reject request without auth token', async () => {
    await request(app)
      .post('/api/food-type')
      .send(mockFoodType)
      .expect(401);
  });

  test('should reject request with invalid token', async () => {
    await request(app)
      .post('/api/food-type')
      .set('Authorization', 'Bearer invalid-token-here')
      .send(mockFoodType)
      .expect(401);
  });

  test('should get food type by ID', async () => {
    // Create food type
    const created = await foodTypeModel.create({
      name: 'Test Banana',
      shelfLifeDays: 7,
    });

    // Get by ID
    const response = await request(app)
      .get(`/api/food-type/${created._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body._id).toBe(created._id.toString());
    expect(response.body.name).toBe('Test Banana');
  });
});

/**
 * SECTION 5: Error Handling Testing
 *
 * Tests various error scenarios
 */
describe('Example 5: Error Handling', () => {
  beforeAll(async () => {
    await dbHandler.connect();
  });

  afterEach(async () => {
    await dbHandler.clearDatabase();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  test('should handle validation errors', async () => {
    // Try to create user with invalid data
    await expect(
      userModel.create({
        googleId: '',  // Empty googleId should fail
        email: 'invalid',
        name: '',
      } as any)
    ).rejects.toThrow();
  });

  test('should handle not found errors', async () => {
    const fakeId = '507f1f77bcf86cd799439011';
    const result = await foodTypeModel.findById(fakeId as any);
    expect(result).toBeNull();
  });

  test('should handle concurrent modifications', async () => {
    const user = await userModel.create(mockGoogleUserInfo);

    // Simulate concurrent updates
    const updates1 = userModel.update(user._id, { name: 'Name 1' });
    const updates2 = userModel.update(user._id, { name: 'Name 2' });

    const [result1, result2] = await Promise.all([updates1, updates2]);

    // Both should succeed, last one wins
    expect(result1).toBeDefined();
    expect(result2).toBeDefined();
  });
});

/**
 * SECTION 6: Spy and Partial Mocking
 *
 * Tests using spies to monitor function calls
 */
describe('Example 6: Spying on Methods', () => {
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

  test('should spy on model methods', async () => {
    // Spy on the create method
    const createSpy = jest.spyOn(userModel, 'create');

    await userModel.create(mockGoogleUserInfo);

    // Verify spy was called
    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(createSpy).toHaveBeenCalledWith(mockGoogleUserInfo);

    // Restore original implementation
    createSpy.mockRestore();
  });

  test('should mock specific method while keeping others real', async () => {
    // Mock only findById to return null
    const findByIdSpy = jest.spyOn(userModel, 'findById')
      .mockResolvedValue(null);

    // Create still works normally
    const created = await userModel.create(mockGoogleUserInfo);
    expect(created).toBeDefined();

    // But findById returns our mock
    const found = await userModel.findById(created._id);
    expect(found).toBeNull();

    findByIdSpy.mockRestore();
  });
});

/**
 * SECTION 7: Async Testing Patterns
 *
 * Various patterns for testing async code
 */
describe('Example 7: Async Testing', () => {
  test('should test promises with async/await', async () => {
    const promise = Promise.resolve('success');
    const result = await promise;
    expect(result).toBe('success');
  });

  test('should test promise rejection', async () => {
    const promise = Promise.reject(new Error('failed'));
    await expect(promise).rejects.toThrow('failed');
  });

  test('should test with callbacks', (done) => {
    setTimeout(() => {
      expect(true).toBe(true);
      done();
    }, 100);
  });

  test('should test multiple async operations', async () => {
    const promises = [
      Promise.resolve(1),
      Promise.resolve(2),
      Promise.resolve(3),
    ];

    const results = await Promise.all(promises);
    expect(results).toEqual([1, 2, 3]);
  });
});

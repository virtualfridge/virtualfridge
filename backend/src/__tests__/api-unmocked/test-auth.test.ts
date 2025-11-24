/**
 * Test Auth API Tests - WITHOUT ADDITIONAL MOCKING
 *
 * Tests for test-only authentication endpoints
 * API Endpoints:
 * - POST /api/test-auth/test-user - Create or get test user and return JWT
 */

import { describe, expect, test, beforeAll, afterAll, afterEach } from '@jest/globals';
import request from 'supertest';
import { createTestApp } from '../helpers/testApp';
import * as dbHandler from '../helpers/dbHandler';

/**
 * =============================================================================
 * TEST SUITE FOR: POST /api/test-auth/test-user
 * =============================================================================
 */

describe('POST /api/test-auth/test-user - WITHOUT ADDITIONAL MOCKING', () => {
  const app = createTestApp();

  beforeAll(async () => {
    await dbHandler.connect();
  });

  afterEach(async () => {
    await dbHandler.clearDatabase();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  /**
   * Test: Create test user and get JWT token
   *
   * Input:
   * - HTTP Method: POST
   * - Endpoint: /api/test-auth/test-user
   * - Headers: None
   * - Body: None
   *
   * Expected Status Code: 200
   *
   * Expected Output:
   * - Response contains data.token (JWT)
   * - Response contains data.user object
   * - user has _id, email, name, bio, profilePicture fields
   *
   * Expected Behavior:
   * - Creates test user if doesn't exist
   * - Finds existing test user if already exists
   * - Generates JWT token for test user
   * - Returns token and user data
   *
   * Mocking:
   * - None (real database and JWT generation)
   */
  test('should create test user and return JWT token', async () => {
    const response = await request(app)
      .post('/api/test-auth/test-user')
      .expect(200);

    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('token');
    expect(response.body.data).toHaveProperty('user');
    expect(response.body.data.user).toHaveProperty('_id');
    expect(response.body.data.user).toHaveProperty('email');
    expect(response.body.data.user).toHaveProperty('name');
    expect(response.body.data.user.email).toBe('test-user@virtualfridge.test');
    expect(response.body.data.user.name).toBe('Test User');
    expect(typeof response.body.data.token).toBe('string');
  });

  /**
   * Test: Return same user on subsequent calls
   *
   * Input:
   * - HTTP Method: POST
   * - Endpoint: /api/test-auth/test-user
   * - Headers: None
   * - Body: None
   *
   * Expected Status Code: 200
   *
   * Expected Output:
   * - Same user ID as first call
   * - JWT token returned
   *
   * Expected Behavior:
   * - Finds existing test user (doesn't create duplicate)
   * - Generates JWT token
   * - Returns same user
   *
   * Mocking:
   * - None
   */
  test('should return same user on subsequent calls', async () => {
    // First call - creates user
    const firstResponse = await request(app)
      .post('/api/test-auth/test-user')
      .expect(200);

    const firstUserId = firstResponse.body.data.user._id;

    // Second call - finds existing user
    const secondResponse = await request(app)
      .post('/api/test-auth/test-user')
      .expect(200);

    const secondUserId = secondResponse.body.data.user._id;

    // Same user ID (doesn't create duplicate)
    expect(secondUserId).toBe(firstUserId);

    // Both responses have valid tokens
    expect(typeof secondResponse.body.data.token).toBe('string');
    expect(secondResponse.body.data.token.length).toBeGreaterThan(0);
  });
});

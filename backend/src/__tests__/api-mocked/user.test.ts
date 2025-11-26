/**
 * User Controller API Tests
 *
 * Tests for all user profile management endpoints
 */

import {
  describe,
  expect,
  test,
  jest,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { createTestApp } from '../helpers/testApp';
import * as dbHandler from '../helpers/dbHandler';
import { userModel } from '../../models/user';
import { mockGoogleUserInfo } from '../helpers/testData';
import * as MediaService from '../../services/media';

// Mock MediaService - always mocked as it interacts with file system
jest.mock('../../services/media');

/**
 * =============================================================================
 * TEST SUITE FOR: GET /api/user/profile
 * =============================================================================
 */

describe('GET /api/user/profile - WITHOUT ADDITIONAL MOCKING', () => {
  const app = createTestApp();
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    await dbHandler.connect();
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    // Mock MediaService
    (MediaService.deleteAllUserImages as jest.Mock) = jest
      .fn()
      .mockResolvedValue(undefined);

    // Create test user before each test
    const user = await userModel.create(mockGoogleUserInfo);
    userId = user._id.toString();
    authToken = jwt.sign({ id: userId }, process.env.JWT_SECRET!, {
      expiresIn: '1h',
    });
  });

  afterEach(async () => {
    await dbHandler.clearDatabase();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  /**
   * Test: Get user profile with valid authentication
   *
   * Input:
   * - HTTP Method: GET
   * - Endpoint: /api/user/profile
   * - Headers: Authorization: Bearer <valid JWT token>
   * - Body: None
   *
   * Expected Status Code: 200
   *
   * Expected Output:
   * - Response body contains 'message' property
   * - Response body contains 'data.user' object
   * - user object contains email, name, and googleId matching mockGoogleUserInfo
   *
   * Expected Behavior:
   * - JWT token is validated successfully
   * - User ID from token is used to fetch user profile
   * - User profile is retrieved from database
   * - Full user object is returned in response
   *
   * Mocking:
   * - Mock: MediaService (module-level mock)
   * - Mock Behavior: N/A for this test
   * - Mock Purpose: MediaService is always mocked to prevent file system interactions
   */
  test('should get user profile with authentication', async () => {
    const response = await request(app)
      .get('/api/user/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('user');
    expect(response.body.data.user).toHaveProperty(
      'email',
      mockGoogleUserInfo.email
    );
    expect(response.body.data.user).toHaveProperty(
      'name',
      mockGoogleUserInfo.name
    );
    expect(response.body.data.user).toHaveProperty(
      'googleId',
      mockGoogleUserInfo.googleId
    );
  });

  /**
   * Test: Reject request without authentication token
   *
   * Input:
   * - HTTP Method: GET
   * - Endpoint: /api/user/profile
   * - Headers: NONE (no Authorization header)
   * - Body: None
   *
   * Expected Status Code: 401
   *
   * Expected Output:
   * - Unauthorized error response
   *
   * Expected Behavior:
   * - Request is rejected before reaching controller
   * - Authentication middleware (authenticateToken) blocks the request
   * - No database query is made
   *
   * Mocking:
   * - Mock: MediaService (module-level mock)
   * - Mock Behavior: N/A for this test
   * - Mock Purpose: MediaService is always mocked to prevent file system interactions
   */
  test('should return 401 without authentication token', async () => {
    await request(app).get('/api/user/profile').expect(401);
  });

  /**
   * Test: Reject request with invalid JWT token
   *
   * Input:
   * - HTTP Method: GET
   * - Endpoint: /api/user/profile
   * - Headers: Authorization: Bearer invalid-token
   * - Body: None
   *
   * Expected Status Code: 401
   *
   * Expected Output:
   * - Unauthorized error response
   *
   * Expected Behavior:
   * - JWT verification fails in authentication middleware
   * - Request is rejected before reaching controller
   * - No database query is made
   *
   * Mocking:
   * - Mock: MediaService (module-level mock)
   * - Mock Behavior: N/A for this test
   * - Mock Purpose: MediaService is always mocked to prevent file system interactions
   */
  test('should return 401 with invalid token', async () => {
    await request(app)
      .get('/api/user/profile')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });
});

/**
 * =============================================================================
 * TEST SUITE FOR: POST /api/user/profile
 * =============================================================================
 */

describe('POST /api/user/profile - WITHOUT ADDITIONAL MOCKING', () => {
  const app = createTestApp();
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    await dbHandler.connect();
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    // Mock MediaService
    (MediaService.deleteAllUserImages as jest.Mock) = jest
      .fn()
      .mockResolvedValue(undefined);

    // Create test user before each test
    const user = await userModel.create(mockGoogleUserInfo);
    userId = user._id.toString();
    authToken = jwt.sign({ id: userId }, process.env.JWT_SECRET!, {
      expiresIn: '1h',
    });
  });

  afterEach(async () => {
    await dbHandler.clearDatabase();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  /**
   * Test: Update user profile successfully
   *
   * Input:
   * - HTTP Method: POST
   * - Endpoint: /api/user/profile
   * - Headers: Authorization: Bearer <valid JWT token>
   * - Body: { name: 'Updated Name', bio: 'Updated bio' }
   *
   * Expected Status Code: 200
   *
   * Expected Output:
   * - Response body contains 'message' property
   * - Response body contains 'data.user' object
   * - user.name matches 'Updated Name'
   * - user.bio matches 'Updated bio'
   *
   * Expected Behavior:
   * - JWT token is validated successfully
   * - Request body is validated against updateProfileSchema
   * - User is updated in database with new values
   * - Updated user object is returned in response
   *
   * Mocking:
   * - Mock: MediaService (module-level mock)
   * - Mock Behavior: N/A for this test
   * - Mock Purpose: MediaService is always mocked to prevent file system interactions
   */
  test('should update user profile successfully', async () => {
    const updates = {
      name: 'Updated Name',
      bio: 'Updated bio',
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
  });

  /**
   * Test: Reject request without authentication token
   *
   * Input:
   * - HTTP Method: POST
   * - Endpoint: /api/user/profile
   * - Headers: NONE (no Authorization header)
   * - Body: { name: 'Test' }
   *
   * Expected Status Code: 401
   *
   * Expected Output:
   * - Unauthorized error response
   *
   * Expected Behavior:
   * - Request is rejected before reaching controller
   * - Authentication middleware (authenticateToken) blocks the request
   * - No database update is made
   *
   * Mocking:
   * - Mock: MediaService (module-level mock)
   * - Mock Behavior: N/A for this test
   * - Mock Purpose: MediaService is always mocked to prevent file system interactions
   */
  test('should return 401 without authentication token', async () => {
    await request(app)
      .post('/api/user/profile')
      .send({ name: 'Test' })
      .expect(401);
  });

  /**
   * Test: Handle validation errors for invalid input
   *
   * Input:
   * - HTTP Method: POST
   * - Endpoint: /api/user/profile
   * - Headers: Authorization: Bearer <valid JWT token>
   * - Body: { bio: 'x'.repeat(501) } // Bio exceeds 500 character limit
   *
   * Expected Status Code: 400
   *
   * Expected Output:
   * - Response body contains 'error' property with validation error details
   *
   * Expected Behavior:
   * - Request body is validated against updateProfileSchema
   * - Validation fails because bio exceeds maximum length of 500 characters
   * - Returns 400 Bad Request before database update
   * - Error message indicates validation failure
   *
   * Mocking:
   * - Mock: MediaService (module-level mock)
   * - Mock Behavior: N/A for this test
   * - Mock Purpose: MediaService is always mocked to prevent file system interactions
   */
  test('should handle validation errors', async () => {
    // Send bio that's too long to trigger validation error
    const response = await request(app)
      .post('/api/user/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ bio: 'x'.repeat(501) })
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });
});

describe('POST /api/user/profile - WITH ADDITIONAL MOCKING', () => {
  const app = createTestApp();
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    await dbHandler.connect();
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    // Mock MediaService
    (MediaService.deleteAllUserImages as jest.Mock) = jest
      .fn()
      .mockResolvedValue(undefined);

    // Create test user before each test
    const user = await userModel.create(mockGoogleUserInfo);
    userId = user._id.toString();
    authToken = jwt.sign({ id: userId }, process.env.JWT_SECRET!, {
      expiresIn: '1h',
    });
  });

  afterEach(async () => {
    await dbHandler.clearDatabase();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  /**
   * Test: Return 404 when updating non-existent user
   *
   * Input:
   * - HTTP Method: POST
   * - Endpoint: /api/user/profile
   * - Headers: Authorization: Bearer <valid JWT token>
   * - Body: { name: 'Test' }
   *
   * Expected Status Code: 404
   *
   * Expected Output:
   * - Response body contains 'message' property with 'not found' text
   *
   * Expected Behavior:
   * - userModel.update() returns null (user not found)
   * - Controller checks for null result
   * - Returns 404 Not Found with appropriate error message
   *
   * Mocking:
   * - Mock: MediaService (module-level mock)
   * - Mock Behavior: N/A for this test
   * - Mock Purpose: MediaService is always mocked to prevent file system interactions
   * - Mock: userModel.update() method
   * - Mock Behavior: Resolve with null
   * - Mock Purpose: Simulate user not found scenario
   */
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

  /**
   * Test: Handle Error exceptions during profile update
   *
   * Input:
   * - HTTP Method: POST
   * - Endpoint: /api/user/profile
   * - Headers: Authorization: Bearer <valid JWT token>
   * - Body: { name: 'Test' }
   *
   * Expected Status Code: 500
   *
   * Expected Output:
   * - Response body contains 'message' property with error message 'Database error'
   *
   * Expected Behavior:
   * - userModel.update() throws an Error
   * - Controller catches the error and returns 500
   * - Error is logged
   *
   * Mocking:
   * - Mock: MediaService (module-level mock)
   * - Mock Behavior: N/A for this test
   * - Mock Purpose: MediaService is always mocked to prevent file system interactions
   * - Mock: userModel.update() method
   * - Mock Behavior: Reject with Error('Database error')
   * - Mock Purpose: Simulate database update failure
   */
  test('should handle Error exceptions in update', async () => {
    // Mock userModel.update to throw Error
    jest
      .spyOn(userModel, 'update')
      .mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app)
      .post('/api/user/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Test' })
      .expect(500);

    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toBe('Database error');
  });

  /**
   * Test: Handle non-Error exceptions during profile update
   *
   * Input:
   * - HTTP Method: POST
   * - Endpoint: /api/user/profile
   * - Headers: Authorization: Bearer <valid JWT token>
   * - Body: { name: 'Test' }
   *
   * Expected Status Code: 500
   *
   * Expected Output:
   * - 500 Internal Server Error
   *
   * Expected Behavior:
   * - userModel.update() throws a non-Error exception (string)
   * - Controller catches the exception and passes to error handling middleware
   * - Returns 500 status code
   *
   * Mocking:
   * - Mock: MediaService (module-level mock)
   * - Mock Behavior: N/A for this test
   * - Mock Purpose: MediaService is always mocked to prevent file system interactions
   * - Mock: userModel.update() method
   * - Mock Behavior: Reject with string 'string error'
   * - Mock Purpose: Test handling of non-Error exceptions (edge case)
   */
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

/**
 * =============================================================================
 * TEST SUITE FOR: DELETE /api/user/profile
 * =============================================================================
 */

describe('DELETE /api/user/profile - WITHOUT ADDITIONAL MOCKING', () => {
  const app = createTestApp();
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    await dbHandler.connect();
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    // Mock MediaService
    (MediaService.deleteAllUserImages as jest.Mock) = jest
      .fn()
      .mockResolvedValue(undefined);

    // Create test user before each test
    const user = await userModel.create(mockGoogleUserInfo);
    userId = user._id.toString();
    authToken = jwt.sign({ id: userId }, process.env.JWT_SECRET!, {
      expiresIn: '1h',
    });
  });

  afterEach(async () => {
    await dbHandler.clearDatabase();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  /**
   * Test: Delete user profile successfully
   *
   * Input:
   * - HTTP Method: DELETE
   * - Endpoint: /api/user/profile
   * - Headers: Authorization: Bearer <valid JWT token>
   * - Body: None
   *
   * Expected Status Code: 200
   *
   * Expected Output:
   * - Response body contains 'message' property with 'deleted' text
   * - User is actually removed from database
   * - Subsequent findById returns null
   *
   * Expected Behavior:
   * - JWT token is validated successfully
   * - MediaService.deleteAllUserImages() is called to remove user's files
   * - User is deleted from database
   * - Success message is returned
   * - Database verification confirms deletion
   *
   * Mocking:
   * - Mock: MediaService (module-level mock)
   * - Mock Behavior: deleteAllUserImages() resolves to undefined
   * - Mock Purpose: MediaService is always mocked to prevent file system interactions
   */
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

  /**
   * Test: Reject request without authentication token
   *
   * Input:
   * - HTTP Method: DELETE
   * - Endpoint: /api/user/profile
   * - Headers: NONE (no Authorization header)
   * - Body: None
   *
   * Expected Status Code: 401
   *
   * Expected Output:
   * - Unauthorized error response
   *
   * Expected Behavior:
   * - Request is rejected before reaching controller
   * - Authentication middleware (authenticateToken) blocks the request
   * - No deletion occurs
   *
   * Mocking:
   * - Mock: MediaService (module-level mock)
   * - Mock Behavior: N/A for this test
   * - Mock Purpose: MediaService is always mocked to prevent file system interactions
   */
  test('should return 401 without authentication token', async () => {
    await request(app).delete('/api/user/profile').expect(401);
  });
});

describe('DELETE /api/user/profile - WITH ADDITIONAL MOCKING', () => {
  const app = createTestApp();
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    await dbHandler.connect();
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    // Mock MediaService
    (MediaService.deleteAllUserImages as jest.Mock) = jest
      .fn()
      .mockResolvedValue(undefined);

    // Create test user before each test
    const user = await userModel.create(mockGoogleUserInfo);
    userId = user._id.toString();
    authToken = jwt.sign({ id: userId }, process.env.JWT_SECRET!, {
      expiresIn: '1h',
    });
  });

  afterEach(async () => {
    await dbHandler.clearDatabase();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  /**
   * Test: Handle Error exceptions during file deletion
   *
   * Input:
   * - HTTP Method: DELETE
   * - Endpoint: /api/user/profile
   * - Headers: Authorization: Bearer <valid JWT token>
   * - Body: None
   *
   * Expected Status Code: 500
   *
   * Expected Output:
   * - Response body contains 'message' property with error message 'Storage deletion failed'
   *
   * Expected Behavior:
   * - MediaService.deleteAllUserImages() throws an Error
   * - Controller catches the error before database deletion
   * - Returns 500 with error message
   * - User is NOT deleted from database (rollback scenario)
   *
   * Mocking:
   * - Mock: MediaService (module-level mock)
   * - Mock Behavior: deleteAllUserImages() rejects with Error('Storage deletion failed')
   * - Mock Purpose: Simulate file system deletion failure
   */
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

  /**
   * Test: Handle non-Error exceptions during database deletion
   *
   * Input:
   * - HTTP Method: DELETE
   * - Endpoint: /api/user/profile
   * - Headers: Authorization: Bearer <valid JWT token>
   * - Body: None
   *
   * Expected Status Code: 500
   *
   * Expected Output:
   * - 500 Internal Server Error
   *
   * Expected Behavior:
   * - userModel.delete() throws a non-Error exception (string)
   * - Controller catches the exception and passes to error handling middleware
   * - Returns 500 status code
   *
   * Mocking:
   * - Mock: MediaService (module-level mock)
   * - Mock Behavior: deleteAllUserImages() resolves normally
   * - Mock Purpose: MediaService is always mocked to prevent file system interactions
   * - Mock: userModel.delete() method
   * - Mock Behavior: Reject with string 'deletion error'
   * - Mock Purpose: Test handling of non-Error exceptions (edge case)
   */
  test('should handle non-Error exceptions during deletion', async () => {
    // Mock userModel.delete to throw non-Error object
    jest.spyOn(userModel, 'delete').mockRejectedValueOnce('deletion error');

    await request(app)
      .delete('/api/user/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(500);
  });
});

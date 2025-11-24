/**
 * Auth Controller API Tests
 *
 * Tests for authentication endpoints
 * Note: ALL tests require Google OAuth2Client mocking as we cannot make real calls to Google's OAuth API
 */

import { describe, expect, test, jest, beforeAll, afterAll, afterEach, beforeEach } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import * as dbHandler from '../helpers/dbHandler';
import { userModel } from '../../models/user';
import { mockGoogleUserInfo } from '../helpers/testData';

// Setup mock before any imports
const mockVerifyIdToken: jest.Mock = jest.fn();
jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: mockVerifyIdToken,
  })),
}));

// Import after mocking
import { createTestApp } from '../helpers/testApp';

/**
 * =============================================================================
 * TEST SUITE FOR: POST /api/auth/google
 * =============================================================================
 */

describe('POST /api/auth/google - WITHOUT ADDITIONAL MOCKING', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test: Login existing user successfully
   *
   * Input:
   * - HTTP Method: POST
   * - Endpoint: /api/auth/google
   * - Headers: None
   * - Body: { idToken: 'valid-google-token' }
   *
   * Expected Status Code: 200
   *
   * Expected Output:
   * - Response body contains 'token' property (JWT)
   * - Response body contains 'user' object with email and _id
   * - JWT token is valid and contains user ID
   *
   * Expected Behavior:
   * - Google OAuth2 token is verified successfully
   * - Existing user is found in database by googleId
   * - JWT token is generated for the user
   * - User object is returned in response
   *
   * Mocking:
   * - Mock: Google OAuth2Client.verifyIdToken()
   * - Mock Behavior: Returns valid payload with user info
   * - Mock Purpose: Cannot make real calls to Google OAuth API
   */
  test('should login existing user successfully', async () => {
    // Create a user first
    const existingUser = await userModel.create(mockGoogleUserInfo);

    // Mock Google token verification
    const mockPayload = {
      sub: mockGoogleUserInfo.googleId,
      email: mockGoogleUserInfo.email,
      name: mockGoogleUserInfo.name,
      picture: mockGoogleUserInfo.profilePicture,
    };

    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => mockPayload,
    });

    const response = await request(app)
      .post('/api/auth/google')
      .send({ idToken: 'valid-google-token' })
      .expect(200);

    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
    expect(response.body.user.email).toBe(mockGoogleUserInfo.email);
    expect(response.body.user._id).toBe(existingUser._id.toString());

    // Verify JWT token
    const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET!) as any;
    expect(decoded.id).toBe(existingUser._id.toString());
  });

  /**
   * Test: Create new user on first login
   *
   * Input:
   * - HTTP Method: POST
   * - Endpoint: /api/auth/google
   * - Headers: None
   * - Body: { idToken: 'valid-google-token' }
   *
   * Expected Status Code: 200
   *
   * Expected Output:
   * - Response body contains JWT token
   * - Response body contains newly created user object
   * - User is persisted in database
   *
   * Expected Behavior:
   * - Google OAuth2 token is verified
   * - No existing user found with googleId
   * - New user is created in database
   * - JWT token is generated
   *
   * Mocking:
   * - Mock: Google OAuth2Client.verifyIdToken()
   * - Mock Behavior: Returns valid payload for new user
   * - Mock Purpose: Cannot make real calls to Google OAuth API
   */
  test('should create new user when logging in for first time', async () => {
    const newUserInfo = {
      googleId: 'new-google-id',
      email: 'newuser@example.com',
      name: 'New User',
      profilePicture: 'https://example.com/new.jpg',
    };

    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: newUserInfo.googleId,
        email: newUserInfo.email,
        name: newUserInfo.name,
        picture: newUserInfo.profilePicture,
      }),
    });

    const response = await request(app)
      .post('/api/auth/google')
      .send({ idToken: 'valid-google-token' })
      .expect(200);

    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
    expect(response.body.user.email).toBe(newUserInfo.email);
    expect(response.body.user.googleId).toBe(newUserInfo.googleId);

    // Verify user was created in database
    const userInDb = await userModel.findByGoogleId(newUserInfo.googleId);
    expect(userInDb).toBeDefined();
    expect(userInDb?.email).toBe(newUserInfo.email);
  });

  /**
   * Test: Reject request with missing idToken
   *
   * Input:
   * - HTTP Method: POST
   * - Endpoint: /api/auth/google
   * - Headers: None
   * - Body: {} (empty)
   *
   * Expected Status Code: 400
   *
   * Expected Output:
   * - Response body contains 'error' property
   * - Validation error message
   *
   * Expected Behavior:
   * - Validation middleware catches missing required field
   * - Request is rejected before reaching controller
   *
   * Mocking:
   * - Mock: Google OAuth2Client (not invoked due to early validation failure)
   * - Mock Purpose: Required for test setup but not used in this test
   */
  test('should return 400 when idToken is missing', async () => {
    const response = await request(app)
      .post('/api/auth/google')
      .send({})
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });
});

describe('POST /api/auth/google - WITH ADDITIONAL MOCKING', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test: Handle invalid Google OAuth token
   *
   * Input:
   * - HTTP Method: POST
   * - Endpoint: /api/auth/google
   * - Headers: None
   * - Body: { idToken: 'invalid-token' }
   *
   * Expected Status Code: 401
   *
   * Expected Output:
   * - Response body contains 'error' property
   * - Unauthorized error message
   *
   * Expected Behavior:
   * - Google OAuth2Client.verifyIdToken() throws error
   * - Error is caught by controller
   * - 401 response is returned
   *
   * Mocking:
   * - Mock: Google OAuth2Client.verifyIdToken()
   * - Mock Behavior: Rejects with Error('Invalid token')
   * - Mock Purpose: Simulate Google rejecting invalid token
   */
  test('should return 401 when Google token is invalid', async () => {
    mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'));

    const response = await request(app)
      .post('/api/auth/google')
      .send({ idToken: 'invalid-token' })
      .expect(401);

    expect(response.body).toHaveProperty('error');
  });

  /**
   * Test: Handle non-Error exceptions
   *
   * Input:
   * - HTTP Method: POST
   * - Endpoint: /api/auth/google
   * - Headers: None
   * - Body: { idToken: 'valid-token' }
   *
   * Expected Status Code: 500
   *
   * Expected Output:
   * - 500 Internal Server Error
   *
   * Expected Behavior:
   * - authService.authenticateWithGoogle() throws non-Error exception
   * - Exception is caught by error handler middleware
   * - 500 response is returned
   *
   * Mocking:
   * - Mock: authService.authenticateWithGoogle()
   * - Mock Behavior: Rejects with string 'string error'
   * - Mock Purpose: Test handling of non-standard exception types
   */
  test('should handle non-Error exceptions in googleAuth', async () => {
    // Mock authService to throw non-Error
    const { authService } = require('../../services/auth');
    jest.spyOn(authService, 'authenticateWithGoogle').mockRejectedValueOnce('string error');

    await request(app)
      .post('/api/auth/google')
      .send({ idToken: 'valid-token' })
      .expect(500);
  });
});

/**
 * =============================================================================
 * TEST SUITE FOR: POST /api/auth/signup
 * =============================================================================
 */

describe('POST /api/auth/signup - WITHOUT ADDITIONAL MOCKING', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test: Sign up new user successfully
   *
   * Input:
   * - HTTP Method: POST
   * - Endpoint: /api/auth/signup
   * - Headers: None
   * - Body: { idToken: 'valid-google-token' }
   *
   * Expected Status Code: 201
   *
   * Expected Output:
   * - Response message confirms successful signup
   * - Response contains JWT token
   * - Response contains user object
   * - User is created in database
   *
   * Expected Behavior:
   * - Google OAuth token is verified
   * - User doesn't exist yet (checked by googleId)
   * - New user is created in database
   * - JWT token is generated
   *
   * Mocking:
   * - Mock: Google OAuth2Client.verifyIdToken()
   * - Mock Behavior: Returns valid user payload
   * - Mock Purpose: Cannot make real calls to Google OAuth API
   */
  test('should sign up new user successfully', async () => {
    const newUserInfo = {
      googleId: 'signup-google-id',
      email: 'signup@example.com',
      name: 'Signup User',
      profilePicture: 'https://example.com/signup.jpg',
    };

    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: newUserInfo.googleId,
        email: newUserInfo.email,
        name: newUserInfo.name,
        picture: newUserInfo.profilePicture,
      }),
    });

    const response = await request(app)
      .post('/api/auth/signup')
      .send({ idToken: 'valid-google-token' })
      .expect(201);

    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('signed up successfully');
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('token');
    expect(response.body.data).toHaveProperty('user');
    expect(response.body.data.user.email).toBe(newUserInfo.email);

    // Verify user was created in database
    const userInDb = await userModel.findByGoogleId(newUserInfo.googleId);
    expect(userInDb).toBeDefined();
  });

  /**
   * Test: Reject signup for existing user
   *
   * Input:
   * - HTTP Method: POST
   * - Endpoint: /api/auth/signup
   * - Headers: None
   * - Body: { idToken: 'valid-token' }
   *
   * Expected Status Code: 409
   *
   * Expected Output:
   * - Response message indicates user already exists
   * - Conflict error (409)
   *
   * Expected Behavior:
   * - Google token is verified successfully
   * - User is found in database by googleId
   * - Signup is rejected with 409 Conflict
   *
   * Mocking:
   * - Mock: Google OAuth2Client.verifyIdToken()
   * - Mock Behavior: Returns payload for existing user
   * - Mock Purpose: Cannot make real calls to Google OAuth API
   */
  test('should return 409 when user already exists', async () => {
    // Create existing user
    const existingUser = await userModel.create(mockGoogleUserInfo);

    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: mockGoogleUserInfo.googleId,
        email: mockGoogleUserInfo.email,
        name: mockGoogleUserInfo.name,
        picture: mockGoogleUserInfo.profilePicture,
      }),
    });

    const response = await request(app)
      .post('/api/auth/signup')
      .send({ idToken: 'valid-token' })
      .expect(409);

    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('already exists');
  });
});

describe('POST /api/auth/signup - WITH ADDITIONAL MOCKING', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test: Handle invalid Google OAuth token during signup
   *
   * Input:
   * - HTTP Method: POST
   * - Endpoint: /api/auth/signup
   * - Headers: None
   * - Body: { idToken: 'invalid-token' }
   *
   * Expected Status Code: 401
   *
   * Expected Output:
   * - Response message: 'Invalid Google token'
   *
   * Expected Behavior:
   * - OAuth2Client.verifyIdToken() rejects with error
   * - Error is caught and 401 is returned
   *
   * Mocking:
   * - Mock: Google OAuth2Client.verifyIdToken()
   * - Mock Behavior: Rejects with Error('Invalid Google token')
   * - Mock Purpose: Simulate Google rejecting invalid token
   */
  test('should return 401 for invalid Google token', async () => {
    mockVerifyIdToken.mockRejectedValue(new Error('Invalid Google token'));

    const response = await request(app)
      .post('/api/auth/signup')
      .send({ idToken: 'invalid-token' })
      .expect(401);

    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toBe('Invalid Google token');
  });

  /**
   * Test: Handle database failure during user creation
   *
   * Input:
   * - HTTP Method: POST
   * - Endpoint: /api/auth/signup
   * - Headers: None
   * - Body: { idToken: 'valid-token' }
   *
   * Expected Status Code: 500
   *
   * Expected Output:
   * - Response message contains 'Failed to process user information'
   *
   * Expected Behavior:
   * - OAuth token is verified successfully
   * - userModel.create() throws database error
   * - Error is caught and 500 is returned
   *
   * Mocking:
   * - Mock 1: Google OAuth2Client.verifyIdToken() - returns valid payload
   * - Mock 2: userModel.create()
   * - Mock 2 Behavior: Rejects with Error('Failed to process user')
   * - Mock 2 Purpose: Simulate database failure during user creation
   */
  test('should return 500 for failed to process user error', async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/pic.jpg',
      }),
    });

    // Mock userModel.create to throw specific error
    jest.spyOn(userModel, 'create').mockRejectedValueOnce(new Error('Failed to process user'));

    const response = await request(app)
      .post('/api/auth/signup')
      .send({ idToken: 'valid-token' })
      .expect(500);

    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('Failed to process user information');
  });

  /**
   * Test: Handle non-Error exceptions in signup
   *
   * Input:
   * - HTTP Method: POST
   * - Endpoint: /api/auth/signup
   * - Headers: None
   * - Body: { idToken: 'valid-token' }
   *
   * Expected Status Code: 500
   *
   * Expected Output:
   * - 500 Internal Server Error
   *
   * Expected Behavior:
   * - authService.signUpWithGoogle() throws non-Error exception
   * - Exception is caught by error handler
   *
   * Mocking:
   * - Mock: authService.signUpWithGoogle()
   * - Mock Behavior: Rejects with string 'string error'
   * - Mock Purpose: Test handling of non-standard exception types
   */
  test('should handle non-Error exceptions in signup', async () => {
    // Mock authService to throw non-Error
    const { authService } = require('../../services/auth');
    jest.spyOn(authService, 'signUpWithGoogle').mockRejectedValueOnce('string error');

    await request(app)
      .post('/api/auth/signup')
      .send({ idToken: 'valid-token' })
      .expect(500);
  });
});

/**
 * =============================================================================
 * TEST SUITE FOR: POST /api/auth/signin
 * =============================================================================
 */

describe('POST /api/auth/signin - WITHOUT ADDITIONAL MOCKING', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test: Sign in existing user successfully
   *
   * Input:
   * - HTTP Method: POST
   * - Endpoint: /api/auth/signin
   * - Headers: None
   * - Body: { idToken: 'valid-google-token' }
   *
   * Expected Status Code: 200
   *
   * Expected Output:
   * - Response message confirms successful signin
   * - Response contains JWT token
   * - Response contains user object with matching email and ID
   *
   * Expected Behavior:
   * - Google OAuth token is verified
   * - Existing user is found by googleId
   * - JWT token is generated
   * - User data is returned
   *
   * Mocking:
   * - Mock: Google OAuth2Client.verifyIdToken()
   * - Mock Behavior: Returns valid user payload
   * - Mock Purpose: Cannot make real calls to Google OAuth API
   */
  test('should sign in existing user successfully', async () => {
    // Create existing user
    const existingUser = await userModel.create(mockGoogleUserInfo);

    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: mockGoogleUserInfo.googleId,
        email: mockGoogleUserInfo.email,
        name: mockGoogleUserInfo.name,
        picture: mockGoogleUserInfo.profilePicture,
      }),
    });

    const response = await request(app)
      .post('/api/auth/signin')
      .send({ idToken: 'valid-google-token' })
      .expect(200);

    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('signed in successfully');
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('token');
    expect(response.body.data).toHaveProperty('user');
    expect(response.body.data.user.email).toBe(mockGoogleUserInfo.email);
    expect(response.body.data.user._id).toBe(existingUser._id.toString());
  });

  /**
   * Test: Reject signin for non-existent user
   *
   * Input:
   * - HTTP Method: POST
   * - Endpoint: /api/auth/signin
   * - Headers: None
   * - Body: { idToken: 'valid-token' }
   *
   * Expected Status Code: 404
   *
   * Expected Output:
   * - Response message indicates user not found
   *
   * Expected Behavior:
   * - Google token is verified successfully
   * - No user found in database with that googleId
   * - 404 Not Found is returned
   *
   * Mocking:
   * - Mock: Google OAuth2Client.verifyIdToken()
   * - Mock Behavior: Returns payload for non-existent user
   * - Mock Purpose: Cannot make real calls to Google OAuth API
   */
  test('should return 404 when user not found', async () => {
    const nonExistentUser = {
      googleId: 'non-existent-id',
      email: 'nonexistent@example.com',
      name: 'Non Existent',
      picture: 'https://example.com/pic.jpg',
    };

    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: nonExistentUser.googleId,
        email: nonExistentUser.email,
        name: nonExistentUser.name,
        picture: nonExistentUser.picture,
      }),
    });

    const response = await request(app)
      .post('/api/auth/signin')
      .send({ idToken: 'valid-token' })
      .expect(404);

    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('not found');
  });
});

describe('POST /api/auth/signin - WITH ADDITIONAL MOCKING', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test: Handle invalid Google OAuth token during signin
   *
   * Input:
   * - HTTP Method: POST
   * - Endpoint: /api/auth/signin
   * - Headers: None
   * - Body: { idToken: 'invalid-token' }
   *
   * Expected Status Code: 401
   *
   * Expected Output:
   * - Response message: 'Invalid Google token'
   *
   * Expected Behavior:
   * - OAuth2Client.verifyIdToken() rejects with error
   * - Error is caught and 401 is returned
   *
   * Mocking:
   * - Mock: Google OAuth2Client.verifyIdToken()
   * - Mock Behavior: Rejects with Error('Invalid Google token')
   * - Mock Purpose: Simulate Google rejecting invalid token
   */
  test('should return 401 for invalid Google token', async () => {
    mockVerifyIdToken.mockRejectedValue(new Error('Invalid Google token'));

    const response = await request(app)
      .post('/api/auth/signin')
      .send({ idToken: 'invalid-token' })
      .expect(401);

    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toBe('Invalid Google token');
  });

  /**
   * Test: Handle service failure during signin
   *
   * Input:
   * - HTTP Method: POST
   * - Endpoint: /api/auth/signin
   * - Headers: None
   * - Body: { idToken: 'valid-token' }
   *
   * Expected Status Code: 500
   *
   * Expected Output:
   * - Response message contains 'Failed to process user information'
   *
   * Expected Behavior:
   * - OAuth token is verified successfully
   * - authService.signInWithGoogle() throws error
   * - Error is caught and 500 is returned
   *
   * Mocking:
   * - Mock 1: Google OAuth2Client.verifyIdToken() - returns valid payload
   * - Mock 2: authService.signInWithGoogle()
   * - Mock 2 Behavior: Rejects with Error('Failed to process user')
   * - Mock 2 Purpose: Simulate service failure during signin
   */
  test('should return 500 for failed to process user error', async () => {
    // Create existing user
    await userModel.create(mockGoogleUserInfo);

    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: mockGoogleUserInfo.googleId,
        email: mockGoogleUserInfo.email,
        name: mockGoogleUserInfo.name,
        picture: mockGoogleUserInfo.profilePicture,
      }),
    });

    // Mock authService to throw specific error
    const { authService } = require('../../services/auth');
    jest.spyOn(authService, 'signInWithGoogle').mockRejectedValueOnce(new Error('Failed to process user'));

    const response = await request(app)
      .post('/api/auth/signin')
      .send({ idToken: 'valid-token' })
      .expect(500);

    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('Failed to process user information');
  });

  /**
   * Test: Handle non-Error exceptions in signin
   *
   * Input:
   * - HTTP Method: POST
   * - Endpoint: /api/auth/signin
   * - Headers: None
   * - Body: { idToken: 'valid-token' }
   *
   * Expected Status Code: 500
   *
   * Expected Output:
   * - 500 Internal Server Error
   *
   * Expected Behavior:
   * - authService.signInWithGoogle() throws non-Error exception
   * - Exception is caught by error handler
   *
   * Mocking:
   * - Mock: authService.signInWithGoogle()
   * - Mock Behavior: Rejects with string 'string error'
   * - Mock Purpose: Test handling of non-standard exception types
   */
  test('should handle non-Error exceptions in signin', async () => {
    // Mock authService to throw non-Error
    const { authService } = require('../../services/auth');
    jest.spyOn(authService, 'signInWithGoogle').mockRejectedValueOnce('string error');

    await request(app)
      .post('/api/auth/signin')
      .send({ idToken: 'valid-token' })
      .expect(500);
  });
});

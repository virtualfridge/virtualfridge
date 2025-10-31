import { describe, expect, test, jest, beforeAll, afterAll, afterEach, beforeEach } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import * as dbHandler from '../helpers/dbHandler';
import { userModel } from '../../models/user';
import { mockGoogleUserInfo } from '../helpers/testData';

// Setup mock before any imports
const mockVerifyIdToken = jest.fn();
jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: mockVerifyIdToken,
  })),
}));

// Import after mocking
import { createTestApp } from '../helpers/testApp';

describe('Auth Controller Integration Tests', () => {
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

  describe('POST /api/auth/google', () => {
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
      } as any);

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
      } as any);

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

    test('should return 400 when idToken is missing', async () => {
      const response = await request(app)
        .post('/api/auth/google')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should return 401 when Google token is invalid', async () => {
      mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'));

      const response = await request(app)
        .post('/api/auth/google')
        .send({ idToken: 'invalid-token' })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

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

  describe('POST /api/auth/signup', () => {
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
      } as any);

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

    test('should return 401 for invalid Google token', async () => {
      mockVerifyIdToken.mockRejectedValue(new Error('Invalid Google token'));

      const response = await request(app)
        .post('/api/auth/signup')
        .send({ idToken: 'invalid-token' })
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Invalid Google token');
    });

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
      } as any);

      const response = await request(app)
        .post('/api/auth/signup')
        .send({ idToken: 'valid-token' })
        .expect(409);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('already exists');
    });

    test('should return 500 for failed to process user error', async () => {
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({
          sub: 'test-id',
          email: 'test@example.com',
          name: 'Test User',
          picture: 'https://example.com/pic.jpg',
        }),
      } as any);

      // Mock userModel.create to throw specific error
      jest.spyOn(userModel, 'create').mockRejectedValueOnce(new Error('Failed to process user'));

      const response = await request(app)
        .post('/api/auth/signup')
        .send({ idToken: 'valid-token' })
        .expect(500);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Failed to process user information');
    });

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

  describe('POST /api/auth/signin', () => {
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
      } as any);

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

    test('should return 401 for invalid Google token', async () => {
      mockVerifyIdToken.mockRejectedValue(new Error('Invalid Google token'));

      const response = await request(app)
        .post('/api/auth/signin')
        .send({ idToken: 'invalid-token' })
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Invalid Google token');
    });

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
      } as any);

      const response = await request(app)
        .post('/api/auth/signin')
        .send({ idToken: 'valid-token' })
        .expect(404);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('not found');
    });

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
      } as any);

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
});

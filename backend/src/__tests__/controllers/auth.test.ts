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
  });
});

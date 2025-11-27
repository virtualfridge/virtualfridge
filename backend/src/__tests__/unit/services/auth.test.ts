import { describe, expect, test, jest, beforeEach, beforeAll, afterAll, afterEach } from '@jest/globals';
import { OAuth2Client } from 'google-auth-library';
import { AuthService } from '../../../services/auth';
import * as dbHandler from '../../helpers/dbHandler';
import { userModel } from '../../../models/user';
import { mockGoogleUserInfo } from '../../helpers/testData';

// Mock google-auth-library
jest.mock('google-auth-library');

describe('AuthService', () => {
  let authService: AuthService;
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

  beforeEach(() => {
    // Create mock for verifyIdToken
    mockVerifyIdToken = jest.fn();

    // Mock OAuth2Client constructor and its methods
    (OAuth2Client as jest.MockedClass<typeof OAuth2Client>).mockImplementation(() => ({
      verifyIdToken: mockVerifyIdToken,
    } as any));

    authService = new AuthService();
  });

  describe('signUpWithGoogle', () => {
    test('should create new user successfully', async () => {
      const mockPayload = {
        sub: mockGoogleUserInfo.googleId,
        email: mockGoogleUserInfo.email,
        name: mockGoogleUserInfo.name,
        picture: mockGoogleUserInfo.profilePicture,
      };

      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => mockPayload,
      } as any);

      const result = await authService.signUpWithGoogle('valid-token');

      expect(result).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(mockGoogleUserInfo.email);
      expect(result.user.googleId).toBe(mockGoogleUserInfo.googleId);

      // Verify user was created in database
      const userInDb = await userModel.findByGoogleId(mockGoogleUserInfo.googleId);
      expect(userInDb).toBeDefined();
      expect(userInDb?.email).toBe(mockGoogleUserInfo.email);
    });

    test('should throw error when user already exists', async () => {
      // Create existing user
      await userModel.create(mockGoogleUserInfo);

      const mockPayload = {
        sub: mockGoogleUserInfo.googleId,
        email: mockGoogleUserInfo.email,
        name: mockGoogleUserInfo.name,
        picture: mockGoogleUserInfo.profilePicture,
      };

      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => mockPayload,
      } as any);

      await expect(
        authService.signUpWithGoogle('valid-token')
      ).rejects.toThrow('User already exists');
    });

    test('should throw error when Google token is invalid', async () => {
      mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'));

      await expect(
        authService.signUpWithGoogle('invalid-token')
      ).rejects.toThrow();
    });
  });

  describe('signInWithGoogle', () => {
    test('should sign in existing user successfully', async () => {
      // Create existing user
      const existingUser = await userModel.create(mockGoogleUserInfo);

      const mockPayload = {
        sub: mockGoogleUserInfo.googleId,
        email: mockGoogleUserInfo.email,
        name: mockGoogleUserInfo.name,
        picture: mockGoogleUserInfo.profilePicture,
      };

      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => mockPayload,
      } as any);

      const result = await authService.signInWithGoogle('valid-token');

      expect(result).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user._id.toString()).toBe(existingUser._id.toString());
      expect(result.user.email).toBe(mockGoogleUserInfo.email);
    });

    test('should throw error when user does not exist', async () => {
      const mockPayload = {
        sub: 'non-existent-google-id',
        email: 'nonexistent@example.com',
        name: 'Non Existent',
        picture: 'https://example.com/pic.jpg',
      };

      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => mockPayload,
      } as any);

      await expect(
        authService.signInWithGoogle('valid-token')
      ).rejects.toThrow('User not found');
    });

    test('should throw error when Google token is invalid', async () => {
      mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'));

      await expect(
        authService.signInWithGoogle('invalid-token')
      ).rejects.toThrow();
    });
  });
});

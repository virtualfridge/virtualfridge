/**
 * Auth Controller Sign In - Error Coverage
 *
 * Tests controllers/auth.ts lines 76-79 (signIn error handling)
 * Specifically tests the "User not found" error path
 *
 * Coverage targets:
 * - Lines 76-79: if (error.message === 'User not found')
 */

import { describe, expect, test, jest, beforeAll, afterAll, afterEach } from '@jest/globals';
import request from 'supertest';
import { createTestApp } from '../helpers/testApp';
import * as dbHandler from '../helpers/dbHandler';
import { authService } from '../../services/auth';

// Mock google-auth-library
jest.mock('google-auth-library', () => {
  return {
    OAuth2Client: jest.fn().mockImplementation(() => ({
      verifyIdToken: jest.fn(),
    })),
  };
});

describe('Auth Controller - signIn Error Handling (lines 76-79)', () => {
  const app = createTestApp();
  const mockIdToken = 'mock-google-id-token';

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

  /**
   * Test: User not found error
   * Tests controllers/auth.ts lines 76-79
   *
   * This covers:
   * - Line 76: if (error.message === 'User not found')
   * - Lines 77-79: return res.status(404).json({ message: '...' })
   */
  test('should return 404 when user not found during sign in', async () => {
    // Mock verifyGoogleToken to succeed
    jest.spyOn(authService['googleClient'], 'verifyIdToken')
      .mockResolvedValueOnce({
        getPayload: () => ({
          sub: 'non-existent-google-id',
          email: 'nonexistent@example.com',
          name: 'Non Existent User',
          picture: 'https://example.com/photo.jpg',
        }),
      } as any);

    // Mock findByGoogleId to return null (user not found)
    const { userModel } = require('../../models/user');
    jest.spyOn(userModel, 'findByGoogleId').mockResolvedValueOnce(null);

    const response = await request(app)
      .post('/api/auth/signin')
      .send({ idToken: mockIdToken })
      .expect(404);

    expect(response.body.message).toBe('User not found, please sign up first.');

    console.log('[TEST] ✓ Returned 404 for user not found (lines 76-79)');
  });

  /**
   * Test: Invalid Google token error
   * Tests controllers/auth.ts lines 70-73
   */
  test('should return 401 for invalid Google token during sign in', async () => {
    // Mock verifyGoogleToken to throw "Invalid Google token"
    jest.spyOn(authService['googleClient'], 'verifyIdToken')
      .mockRejectedValueOnce(new Error('Invalid token'));

    const response = await request(app)
      .post('/api/auth/signin')
      .send({ idToken: 'invalid-token' })
      .expect(401);

    expect(response.body.message).toBe('Invalid Google token');

    console.log('[TEST] ✓ Returned 401 for invalid Google token');
  });

  /**
   * Test: Failed to process user error
   * Tests controllers/auth.ts lines 82-85
   */
  test('should return 500 for failed to process user error', async () => {
    // Mock authService.signInWithGoogle to throw "Failed to process user"
    jest.spyOn(authService, 'signInWithGoogle')
      .mockRejectedValueOnce(new Error('Failed to process user'));

    const response = await request(app)
      .post('/api/auth/signin')
      .send({ idToken: mockIdToken })
      .expect(500);

    expect(response.body.message).toBe('Failed to process user information');

    console.log('[TEST] ✓ Returned 500 for failed to process user');
  });

  /**
   * Test: Generic error (fallback to next(error))
   * Tests controllers/auth.ts line 89
   */
  test('should pass generic errors to error handler', async () => {
    // Mock authService.signInWithGoogle to throw a non-specific error
    const genericError = new Error('Unexpected error');
    jest.spyOn(authService, 'signInWithGoogle')
      .mockRejectedValueOnce(genericError);

    const response = await request(app)
      .post('/api/auth/signin')
      .send({ idToken: mockIdToken });

    // Generic errors are handled by the error handler middleware
    // Should get a 500 or error response
    expect(response.status).toBeGreaterThanOrEqual(400);

    console.log('[TEST] ✓ Passed generic error to error handler');
  });
});

console.log('✓ Auth sign in error tests loaded');

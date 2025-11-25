/**
 * Auth Middleware - Token Validation Coverage
 *
 * Tests middleware/auth.ts lines 25-29 (token missing after split)
 * Also covers other token validation paths
 *
 * Coverage targets:
 * - Lines 14-19: No authorization header or malformed header
 * - Lines 25-29: Token is empty after splitting "Bearer " from header
 */

import { describe, expect, test, beforeAll, afterAll, afterEach } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createTestApp } from '../helpers/testApp';
import * as dbHandler from '../helpers/dbHandler';
import { userModel } from '../../models/user';
import { mockGoogleUserInfo } from '../helpers/testData';

describe('Auth Middleware - Token Validation (lines 25-29)', () => {
  const app = createTestApp();
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    await dbHandler.connect();
  });

  beforeEach(async () => {
    const user = await userModel.create(mockGoogleUserInfo);
    userId = user._id.toString();
    authToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, { expiresIn: '1h' });
  });

  afterEach(async () => {
    await dbHandler.clearDatabase();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  /**
   * Test: No authorization header provided
   * Tests middleware/auth.ts lines 14-19
   */
  test('should return 401 if no token is provided', async () => {
    const response = await request(app)
      .get('/api/user/profile') // any route protected by auth middleware
      // Not sending Authorization header
      .expect(401);

    expect(response.body).toEqual({
      error: 'Access denied',
      message: 'No token provided',
    });

    console.log('[TEST] ✓ Returned 401 for no authorization header (lines 14-19)');
  });

  /**
   * Test: Authorization header without "Bearer " prefix
   * Tests middleware/auth.ts lines 14-19
   */
  test('should return 401 if authorization header does not start with "Bearer "', async () => {
    const response = await request(app)
      .get('/api/user/profile')
      .set('Authorization', 'InvalidPrefix token123')
      .expect(401);

    expect(response.body).toEqual({
      error: 'Access denied',
      message: 'No token provided',
    });

    console.log('[TEST] ✓ Returned 401 for invalid auth header prefix (lines 14-19)');
  });

  /**
   * Test: "Bearer" with no token (lines 25-29)
   * Tests middleware/auth.ts lines 25-29
   *
   * When header is "Bearer" (no space), split(' ')[1] returns undefined
   * This triggers the if (!token) check on line 24
   */
  test('should return 401 if token is malformed (no space after Bearer)', async () => {
    const response = await request(app)
      .get('/api/user/profile')
      .set('Authorization', 'Bearer') // no space, no token
      .expect(401);

    expect(response.body).toEqual({
      error: 'Access denied',
      message: 'No token provided',
    });

    console.log('[TEST] ✓ Returned 401 for "Bearer" without token (lines 25-29)');
  });

  /**
   * Test: "Bearer " with empty token (lines 25-29)
   * Tests middleware/auth.ts lines 25-29
   *
   * When header is "Bearer " (with space but no token), split(' ')[1] returns ''
   * Empty string is falsy, so if (!token) is true
   */
  test('should return 401 if token is empty after Bearer', async () => {
    const response = await request(app)
      .get('/api/user/profile')
      .set('Authorization', 'Bearer ') // space but no token
      .expect(401);

    expect(response.body).toEqual({
      error: 'Access denied',
      message: 'No token provided',
    });

    console.log('[TEST] ✓ Returned 401 for empty token after "Bearer " (lines 25-29)');
  });

  /**
   * Test: Valid token (success path)
   * Tests that valid tokens pass through the middleware
   */
  test('should allow request with valid token', async () => {
    const response = await request(app)
      .get('/api/user/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.data.user).toBeDefined();
    expect(response.body.data.user._id).toBe(userId);

    console.log('[TEST] ✓ Allowed request with valid token');
  });

  /**
   * Test: Invalid/malformed JWT token
   * Tests middleware/auth.ts lines 67-72 (JsonWebTokenError catch)
   */
  test('should return 401 for malformed JWT token', async () => {
    const response = await request(app)
      .get('/api/user/profile')
      .set('Authorization', 'Bearer invalid.jwt.token')
      .expect(401);

    expect(response.body.error).toBe('Invalid token');
    expect(response.body.message).toBe('Token is malformed or expired');

    console.log('[TEST] ✓ Returned 401 for malformed JWT token (lines 67-72)');
  });

  /**
   * Test: Expired JWT token
   * Tests middleware/auth.ts lines 59-64 (TokenExpiredError catch)
   */
  test('should return 401 for expired token', async () => {
    // Create an expired token (expired 1 hour ago)
    const expiredToken = jwt.sign(
      { id: userId },
      process.env.JWT_SECRET!,
      { expiresIn: '-1h' }
    );

    const response = await request(app)
      .get('/api/user/profile')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);

    expect(response.body.error).toBe('Token expired');
    expect(response.body.message).toBe('Please login again');

    console.log('[TEST] ✓ Returned 401 for expired token (lines 59-64)');
  });

  /**
   * Test: Valid token but user doesn't exist
   * Tests middleware/auth.ts lines 46-51
   */
  test('should return 401 if user no longer exists', async () => {
    // Create token for a user that will be deleted
    const tempUser = await userModel.create({
      ...mockGoogleUserInfo,
      googleId: 'temp-google-id',
      email: 'temp@example.com',
    });
    const tempToken = jwt.sign({ id: tempUser._id }, process.env.JWT_SECRET!, { expiresIn: '1h' });

    // Delete the user
    await userModel.delete(tempUser._id);

    const response = await request(app)
      .get('/api/user/profile')
      .set('Authorization', `Bearer ${tempToken}`)
      .expect(401);

    expect(response.body.error).toBe('User not found');
    expect(response.body.message).toBe('Token is valid but user no longer exists');

    console.log('[TEST] ✓ Returned 401 for valid token with deleted user (lines 46-51)');
  });
});

console.log('✓ Auth middleware token validation tests loaded');

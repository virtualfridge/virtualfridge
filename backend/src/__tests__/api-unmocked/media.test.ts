/**
 * Media API Tests - WITHOUT ADDITIONAL MOCKING
 *
 * Tests for media endpoints
 * API Endpoints:
 * - POST /api/media/upload - Upload image
 */

import { describe, expect, test, beforeAll, afterAll, afterEach, beforeEach } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import * as dbHandler from '../helpers/dbHandler';
import { userModel } from '../../models/user';
import { mockGoogleUserInfo } from '../helpers/testData';
import { createTestApp } from '../helpers/testApp';
import path from 'path';
import fs from 'fs';

/**
 * =============================================================================
 * TEST SUITE FOR: POST /api/media/upload
 * =============================================================================
 */

describe('POST /api/media/upload - WITHOUT ADDITIONAL MOCKING', () => {
  const app = createTestApp();
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    await dbHandler.connect();
  });

  beforeEach(async () => {
    const user = await userModel.create(mockGoogleUserInfo);
    userId = user._id.toString();
    authToken = jwt.sign({ id: userId }, process.env.JWT_SECRET!, { expiresIn: '1h' });
  });

  afterEach(async () => {
    await dbHandler.clearDatabase();

    // Clean up test uploads directory
    const uploadsDir = path.join(process.cwd(), 'uploads', `user-${userId}`);
    if (fs.existsSync(uploadsDir)) {
      fs.rmSync(uploadsDir, { recursive: true, force: true });
    }
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  /**
   * Test: Reject request without authentication
   *
   * Input:
   * - HTTP Method: POST
   * - Endpoint: /api/media/upload
   * - Headers: None
   * - Body: multipart/form-data with file
   *
   * Expected Status Code: 401
   *
   * Expected Output:
   * - Unauthorized error
   *
   * Expected Behavior:
   * - Authentication middleware blocks request
   *
   * Mocking:
   * - None
   */
  test('should return 401 without authentication', async () => {
    await request(app)
      .post('/api/media/upload')
      .expect(401);
  });

  /**
   * Test: Reject request with no file uploaded
   *
   * Input:
   * - HTTP Method: POST
   * - Endpoint: /api/media/upload
   * - Headers: Authorization: Bearer <valid-token>
   * - Body: Empty
   *
   * Expected Status Code: 400
   *
   * Expected Output:
   * - Error message: "No file uploaded"
   *
   * Expected Behavior:
   * - Controller checks for file presence
   * - Returns 400 if no file provided
   *
   * Mocking:
   * - None
   */
  test('should return 400 when no file is uploaded', async () => {
    const response = await request(app)
      .post('/api/media/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(400);

    expect(response.body.message).toBe('No file uploaded');
  });

  /**
   * Test: Reject request with invalid token
   *
   * Input:
   * - HTTP Method: POST
   * - Endpoint: /api/media/upload
   * - Headers: Authorization: Bearer invalid-token
   * - Body: multipart/form-data with file
   *
   * Expected Status Code: 401
   *
   * Expected Output:
   * - Unauthorized error
   *
   * Expected Behavior:
   * - Authentication middleware validates token
   * - Rejects invalid token
   *
   * Mocking:
   * - None
   */
  test('should return 401 with invalid token', async () => {
    await request(app)
      .post('/api/media/upload')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });
});

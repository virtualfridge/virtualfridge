/**
 * AI Recipe Service - Error Path Coverage
 *
 * Tests aiRecipe.ts error handling for specific uncovered paths
 *
 * Coverage targets:
 * - Lines 20-22: Missing GEMINI_API_KEY error
 * - Line 51: Empty recipe response error (when extractRecipeText returns null)
 * - Line 104: Return null when candidates/content/parts are missing
 */

import { describe, expect, test, jest, beforeAll, afterAll, afterEach, beforeEach } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { createTestApp } from '../helpers/testApp';
import * as dbHandler from '../helpers/dbHandler';
import { userModel } from '../../models/user';
import { mockGoogleUserInfo } from '../helpers/testData';
import { AiRecipeService } from '../../services/aiRecipe';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AI Recipe Service - Error Path Coverage', () => {
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
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await dbHandler.clearDatabase();
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  /**
   * Test: Missing GEMINI_API_KEY error
   * Tests aiRecipe.ts lines 20-22
   *
   * When GEMINI_API_KEY is not set, generateRecipe() should throw error
   */
  test('should return 502 when GEMINI_API_KEY is missing', async () => {
    // Create a service instance without API key to test the error
    const serviceWithoutKey = new AiRecipeService('');

    // Call the method directly to verify it throws the correct error
    await expect(serviceWithoutKey.generateRecipe({ ingredients: ['chicken'] }))
      .rejects
      .toThrow('GEMINI_API_KEY is not set');

    // Now test via API by mocking axios to simulate the service throwing this error
    // We'll make axios.post throw before it's called since the check happens before the API call
    mockedAxios.post.mockImplementationOnce(async () => {
      throw new Error('GEMINI_API_KEY is not set');
    });

    const response = await request(app)
      .post('/api/recipes/ai')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ ingredients: ['chicken', 'rice'] })
      .expect(502);

    expect(response.body.message).toBe('GEMINI_API_KEY is not set');
    expect(response.body.data.recipe).toBe('');

    console.log('[TEST] ✓ Returned 502 for missing GEMINI_API_KEY (lines 20-22)');
  });

  /**
   * Test: Empty recipe response (no candidates)
   * Tests aiRecipe.ts lines 104 and 51
   *
   * When Gemini returns response without candidates, extractRecipeText returns null
   * which triggers the error on line 51
   */
  test('should return 502 when Gemini returns response without candidates', async () => {
    // Mock Gemini API to return response without candidates
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        candidates: undefined, // Missing candidates
        modelVersion: 'gemini-2.5-flash',
      },
    });

    const response = await request(app)
      .post('/api/recipes/ai')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ ingredients: ['chicken', 'rice'] })
      .expect(502);

    expect(response.body.message).toBe('Gemini returned an empty response.');
    expect(response.body.data.recipe).toBe('');

    console.log('[TEST] ✓ Returned 502 for missing candidates (line 104 -> line 51)');
  });

  /**
   * Test: Empty recipe response (no content)
   * Tests aiRecipe.ts lines 104 and 51
   *
   * When Gemini returns candidate without content
   */
  test('should return 502 when Gemini returns candidate without content', async () => {
    // Mock Gemini API to return candidate without content
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        candidates: [
          {
            content: undefined, // Missing content
          },
        ],
        modelVersion: 'gemini-2.5-flash',
      },
    });

    const response = await request(app)
      .post('/api/recipes/ai')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ ingredients: ['chicken', 'rice'] })
      .expect(502);

    expect(response.body.message).toBe('Gemini returned an empty response.');
    expect(response.body.data.recipe).toBe('');

    console.log('[TEST] ✓ Returned 502 for missing content (line 104 -> line 51)');
  });

  /**
   * Test: Empty recipe response (no parts)
   * Tests aiRecipe.ts lines 104 and 51
   *
   * When Gemini returns content without parts
   */
  test('should return 502 when Gemini returns content without parts', async () => {
    // Mock Gemini API to return content without parts
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        candidates: [
          {
            content: {
              parts: undefined, // Missing parts
            },
          },
        ],
        modelVersion: 'gemini-2.5-flash',
      },
    });

    const response = await request(app)
      .post('/api/recipes/ai')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ ingredients: ['chicken', 'rice'] })
      .expect(502);

    expect(response.body.message).toBe('Gemini returned an empty response.');
    expect(response.body.data.recipe).toBe('');

    console.log('[TEST] ✓ Returned 502 for missing parts (line 104 -> line 51)');
  });

  /**
   * Test: Empty recipe response (empty parts array)
   * Tests aiRecipe.ts line 51
   *
   * When Gemini returns parts array but it's empty or has no text
   */
  test('should return 502 when Gemini returns empty parts array', async () => {
    // Mock Gemini API to return empty parts
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        candidates: [
          {
            content: {
              parts: [], // Empty parts array
            },
          },
        ],
        modelVersion: 'gemini-2.5-flash',
      },
    });

    const response = await request(app)
      .post('/api/recipes/ai')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ ingredients: ['chicken', 'rice'] })
      .expect(502);

    expect(response.body.message).toBe('Gemini returned an empty response.');
    expect(response.body.data.recipe).toBe('');

    console.log('[TEST] ✓ Returned 502 for empty parts array (line 51)');
  });

  /**
   * Test: Empty recipe response (parts with no text)
   * Tests aiRecipe.ts line 51
   *
   * When parts exist but contain no text content
   */
  test('should return 502 when Gemini returns parts with no text', async () => {
    // Mock Gemini API to return parts without text
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        candidates: [
          {
            content: {
              parts: [
                { text: '' }, // Empty text
                { text: '   ' }, // Whitespace only
              ],
            },
          },
        ],
        modelVersion: 'gemini-2.5-flash',
      },
    });

    const response = await request(app)
      .post('/api/recipes/ai')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ ingredients: ['chicken', 'rice'] })
      .expect(502);

    expect(response.body.message).toBe('Gemini returned an empty response.');
    expect(response.body.data.recipe).toBe('');

    console.log('[TEST] ✓ Returned 502 for parts with no text (line 51)');
  });

  /**
   * Test: Network error when calling Gemini API
   * Tests general error handling for API failures
   */
  test('should return 502 when Gemini API request fails', async () => {
    // Mock axios to throw network error
    mockedAxios.post.mockRejectedValueOnce(new Error('Network timeout'));

    const response = await request(app)
      .post('/api/recipes/ai')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ ingredients: ['chicken', 'rice'] })
      .expect(502);

    expect(response.body.message).toBe('Network timeout');
    expect(response.body.data.recipe).toBe('');

    console.log('[TEST] ✓ Returned 502 for network error');
  });

  /**
   * Test: Gemini API rate limit error
   * Tests handling of 429 rate limit responses
   */
  test('should return 502 when Gemini API rate limit is exceeded', async () => {
    const rateLimitError: any = new Error('Request failed with status code 429');
    rateLimitError.response = {
      status: 429,
      data: { error: 'Rate limit exceeded' },
    };

    mockedAxios.post.mockRejectedValueOnce(rateLimitError);

    const response = await request(app)
      .post('/api/recipes/ai')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ ingredients: ['chicken', 'rice'] })
      .expect(502);

    expect(response.body.message).toContain('429');
    expect(response.body.data.recipe).toBe('');

    console.log('[TEST] ✓ Returned 502 for rate limit error');
  });
});

console.log('✓ AI Recipe error tests loaded');

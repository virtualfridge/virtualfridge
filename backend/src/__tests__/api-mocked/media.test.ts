/**
 * Media API Tests - WITH ADDITIONAL MOCKING
 *
 * Tests for media endpoints with AI mocking
 * API Endpoints:
 * - POST /api/media/upload - Upload image
 * - POST /api/media/vision - Vision scan with AI
 */

import { describe, expect, test, jest, beforeAll, afterAll, afterEach, beforeEach } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import * as dbHandler from '../helpers/dbHandler';
import { userModel } from '../../models/user';
import { foodItemModel } from '../../models/foodItem';
import { mockGoogleUserInfo } from '../helpers/testData';
import { createTestApp } from '../helpers/testApp';

// Mock aiVision service
import { aiVisionService } from '../../services/aiVision';
jest.mock('../../services/aiVision');

const mockedAiVision = aiVisionService as jest.Mocked<typeof aiVisionService>;

/**
 * =============================================================================
 * TEST SUITE FOR: POST /api/media/upload
 * =============================================================================
 */

describe('POST /api/media/upload - WITH ADDITIONAL MOCKING', () => {
  const app = createTestApp();
  let authToken: string;
  let userId: string;
  const testImagePath = path.join(__dirname, '../fixtures/images/banana1.jpg');

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

    // Clean up uploaded files
    const uploadsDir = path.join(process.cwd(), 'uploads', `user-${userId}`);
    if (fs.existsSync(uploadsDir)) {
      fs.rmSync(uploadsDir, { recursive: true, force: true });
    }
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  /**
   * Test: Upload image successfully
   *
   * Input:
   * - HTTP Method: POST
   * - Endpoint: /api/media/upload
   * - Headers: Authorization: Bearer <valid-token>
   * - Body: multipart/form-data with image file
   *
   * Expected Status Code: 200
   *
   * Expected Output:
   * - Response message: "Image uploaded successfully"
   * - Response contains image path
   *
   * Expected Behavior:
   * - Validates authentication
   * - Receives multipart file upload
   * - Saves image to user-specific directory
   * - Returns image path
   *
   * Mocking:
   * - None (real file upload and storage)
   */
  test('should upload image successfully', async () => {
    const response = await request(app)
      .post('/api/media/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('media', testImagePath)
      .expect(200);

    expect(response.body.message).toBe('Image uploaded successfully');
    expect(response.body.data).toHaveProperty('image');
    expect(response.body.data.image).toContain('uploads/');
  });

  /**
   * Test: Reject upload without authentication
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
      .attach('media', testImagePath)
      .expect(401);
  });

  /**
   * Test: Reject upload with no file
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
});

/**
 * =============================================================================
 * TEST SUITE FOR: POST /api/media/vision
 * =============================================================================
 */

describe('POST /api/media/vision - WITH ADDITIONAL MOCKING', () => {
  const app = createTestApp();
  let authToken: string;
  let userId: string;
  const testProduceImage = path.join(__dirname, '../fixtures/images/banana1.jpg');
  const testNotProduceImage = path.join(__dirname, '../fixtures/images/tire.jpg');

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

    // Clean up uploaded files
    const uploadsDir = path.join(process.cwd(), 'uploads', `user-${userId}`);
    if (fs.existsSync(uploadsDir)) {
      fs.rmSync(uploadsDir, { recursive: true, force: true });
    }
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  /**
   * Test: Vision scan with valid produce image (Apple)
   *
   * Input:
   * - HTTP Method: POST
   * - Endpoint: /api/media/vision
   * - Headers: Authorization: Bearer <valid-token>
   * - Body: multipart/form-data with produce image file (test-produce.png)
   *
   * Expected Status Code: 200
   *
   * Expected Output:
   * - Response message: "Produce item added to fridge"
   * - Response contains fridgeItem with foodItem and foodType
   * - foodType has name "Apple" from AI analysis
   * - foodType contains nutritional info from AI
   *
   * Expected Behavior:
   * - File is uploaded and saved to user directory
   * - MediaService.saveImage() stores the file
   * - AI service is called with the saved image path
   * - AI detects produce (Apple) from the image
   * - FoodType is created from AI nutritional analysis
   * - FoodItem is created with 100% percentLeft
   * - Returns complete fridgeItem to client
   *
   * Mocking:
   * - Mock: aiVisionService.analyzeProduce()
   * - Mock Behavior: Returns valid produce analysis for Apple
   * - Mock Purpose: Cannot make real calls to Gemini AI API
   * - Verification: Confirms AI service is called with correct image path
   */
  test('should scan produce image (Apple) and create fridge item', async () => {
    // Mock AI vision to return a valid produce item (Apple)
    mockedAiVision.analyzeProduce.mockResolvedValueOnce({
      isProduce: true,
      name: 'Apple',
      category: 'fruit',
      confidence: 0.95,
      nutritionalInfo: {
        calories: 52,
        protein: 0.3,
        carbohydrates: 14,
        sugars: 10,
        fiber: 2.4,
        fat: 0.2,
      },
    });

    const response = await request(app)
      .post('/api/media/vision')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('media', testProduceImage)
      .expect(200);

    // Verify response structure and data
    expect(response.body.message).toBe('Produce item added to fridge');
    expect(response.body.data).toHaveProperty('fridgeItem');
    expect(response.body.data.fridgeItem).toHaveProperty('foodItem');
    expect(response.body.data.fridgeItem).toHaveProperty('foodType');

    // Verify AI detection results are used
    expect(response.body.data.fridgeItem.foodType.name).toBe('Apple');
    expect(response.body.data.fridgeItem.foodItem.percentLeft).toBe(100);

    // CRITICAL: Verify AI service was actually called with the uploaded image
    expect(mockedAiVision.analyzeProduce).toHaveBeenCalledTimes(1);

    // Verify AI service received the correct image path
    const aiCallArgs = mockedAiVision.analyzeProduce.mock.calls[0];
    expect(aiCallArgs[0]).toBeDefined();
    expect(typeof aiCallArgs[0]).toBe('string');
    expect(aiCallArgs[0]).toContain('uploads'); // Image was saved and path passed to AI
  });

  /**
   * Test: Reject non-produce item (e.g., bottle, box, phone)
   *
   * Input:
   * - HTTP Method: POST
   * - Endpoint: /api/media/vision
   * - Headers: Authorization: Bearer <valid-token>
   * - Body: multipart/form-data with non-produce image (test-not-produce.png)
   *
   * Expected Status Code: 400
   *
   * Expected Output:
   * - Error message: "Item detected must be a fruit or vegetable"
   *
   * Expected Behavior:
   * - File is uploaded and saved
   * - AI service is called with the saved image path
   * - AI analyzes the image and detects it's NOT produce
   * - AI returns isProduce=false (e.g., detects a bottle)
   * - Controller rejects the request with 400 error
   * - No FoodType or FoodItem is created
   *
   * Mocking:
   * - Mock: aiVisionService.analyzeProduce()
   * - Mock Behavior: Returns { isProduce: false } (detected non-produce)
   * - Mock Purpose: Simulate AI detecting non-food items
   * - Verification: Confirms AI service was called with uploaded image
   */
  test('should return 400 when AI detects non-produce item (bottle/box)', async () => {
    // Mock AI to detect a non-produce item (e.g., water bottle)
    mockedAiVision.analyzeProduce.mockResolvedValueOnce({
      isProduce: false,
      name: null,
      category: null,
      confidence: 0.8,
      nutritionalInfo: null,
    });

    const response = await request(app)
      .post('/api/media/vision')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('media', testNotProduceImage)
      .expect(400);

    // Verify rejection message
    expect(response.body.message).toBe('Item detected must be a fruit or vegetable');

    // CRITICAL: Verify AI service was called with the uploaded image
    expect(mockedAiVision.analyzeProduce).toHaveBeenCalledTimes(1);

    // Verify AI service received the image path
    const aiCallArgs = mockedAiVision.analyzeProduce.mock.calls[0];
    expect(aiCallArgs[0]).toBeDefined();
    expect(typeof aiCallArgs[0]).toBe('string');
    expect(aiCallArgs[0]).toContain('uploads'); // Image was saved before AI analysis
  });

  /**
   * Test: Vision scan with different produce (Banana)
   *
   * Input:
   * - HTTP Method: POST
   * - Endpoint: /api/media/vision
   * - Headers: Authorization: Bearer <valid-token>
   * - Body: multipart/form-data with different produce image
   *
   * Expected Status Code: 200
   *
   * Expected Output:
   * - Response contains fridgeItem with foodType.name = "Banana"
   * - Different nutritional values than Apple test
   *
   * Expected Behavior:
   * - Uploads different image file
   * - AI service analyzes THIS specific image
   * - AI detects Banana (not Apple)
   * - Creates FoodType with Banana's nutritional info
   *
   * Mocking:
   * - Mock: aiVisionService.analyzeProduce()
   * - Mock Behavior: Returns Banana analysis (different from Apple)
   * - Mock Purpose: Test AI handles different produce types
   * - Verification: AI service called with the new image path
   */
  test('should scan different produce image (Banana) and create fridge item', async () => {
    // Mock AI vision to return a different produce item (Banana)
    mockedAiVision.analyzeProduce.mockResolvedValueOnce({
      isProduce: true,
      name: 'Banana',
      category: 'fruit',
      nutrients: {
        calories: '89',
        protein: '1.1',
        carbohydrates: '23',
        sugars: '12',
        fiber: '2.6',
        fat: '0.3',
      },
    });

    // Use the empty image file as a different image
    const differentProduceImage = path.join(__dirname, '../fixtures/images/empty.png');

    const response = await request(app)
      .post('/api/media/vision')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('media', differentProduceImage)
      .expect(200);

    // Verify AI detected Banana (not Apple)
    expect(response.body.data.fridgeItem.foodType.name).toBe('Banana');
    expect(response.body.data.fridgeItem.foodType.nutrients.calories).toBe('89');

    // Verify AI service was called
    expect(mockedAiVision.analyzeProduce).toHaveBeenCalledTimes(1);

    // Verify AI was called with image path
    const aiCallArgs = mockedAiVision.analyzeProduce.mock.calls[0];
    expect(aiCallArgs[0]).toContain('uploads');
  });

  /**
   * Test: Reject vision scan with no file
   *
   * Input:
   * - HTTP Method: POST
   * - Endpoint: /api/media/vision
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
   * - Returns 400 before calling AI service
   *
   * Mocking:
   * - Mock: aiVisionService (not called due to validation failure)
   */
  test('should return 400 when no file is uploaded', async () => {
    const response = await request(app)
      .post('/api/media/vision')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(400);

    expect(response.body.message).toBe('No file uploaded');
    expect(mockedAiVision.analyzeProduce).not.toHaveBeenCalled();
  });

  /**
   * Test: Reject vision scan without authentication
   *
   * Input:
   * - HTTP Method: POST
   * - Endpoint: /api/media/vision
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
   * - Mock: aiVisionService (not called due to auth failure)
   */
  test('should return 401 without authentication', async () => {
    await request(app)
      .post('/api/media/vision')
      .attach('media', testProduceImage)
      .expect(401);

    expect(mockedAiVision.analyzeProduce).not.toHaveBeenCalled();
  });

  /**
   * Test: Handle AI service error
   *
   * Input:
   * - HTTP Method: POST
   * - Endpoint: /api/media/vision
   * - Headers: Authorization: Bearer <valid-token>
   * - Body: multipart/form-data with image file
   *
   * Expected Status Code: 500
   *
   * Expected Output:
   * - Error message from AI service
   *
   * Expected Behavior:
   * - File is uploaded
   * - AI service throws error (e.g., API timeout, invalid image)
   * - Error is caught and returned as 500
   *
   * Mocking:
   * - Mock: aiVisionService.analyzeProduce()
   * - Mock Behavior: Rejects with Error("AI service unavailable")
   * - Mock Purpose: Simulate AI API failure
   */
  test('should handle AI service errors', async () => {
    mockedAiVision.analyzeProduce.mockRejectedValueOnce(new Error('AI service unavailable'));

    const response = await request(app)
      .post('/api/media/vision')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('media', testProduceImage)
      .expect(500);

    expect(response.body.message).toBe('AI service unavailable');
    expect(mockedAiVision.analyzeProduce).toHaveBeenCalledTimes(1);
  });

  /**
   * Test: Handle produce with no name from AI
   *
   * Input:
   * - HTTP Method: POST
   * - Endpoint: /api/media/vision
   * - Headers: Authorization: Bearer <valid-token>
   * - Body: multipart/form-data with image
   *
   * Expected Status Code: 400
   *
   * Expected Output:
   * - Error message about produce detection
   *
   * Expected Behavior:
   * - AI returns isProduce=true but name=null
   * - Treated as invalid detection
   *
   * Mocking:
   * - Mock: aiVisionService.analyzeProduce()
   * - Mock Behavior: Returns { isProduce: true, name: null }
   * - Mock Purpose: Simulate unclear AI detection
   */
  test('should return 400 when AI cannot identify produce name', async () => {
    mockedAiVision.analyzeProduce.mockResolvedValueOnce({
      isProduce: true,
      name: null,
      category: 'fruit',
      confidence: 0.3,
      nutritionalInfo: null,
    });

    const response = await request(app)
      .post('/api/media/vision')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('media', testProduceImage)
      .expect(400);

    expect(response.body.message).toBe('Item detected must be a fruit or vegetable');
    expect(mockedAiVision.analyzeProduce).toHaveBeenCalledTimes(1);
  });
});

/**
 * =============================================================================
 * ADDITIONAL TESTS FOR 100% COVERAGE
 * =============================================================================
 */

// Import MediaService for mocking
import { MediaService } from '../../services/media';
import { foodTypeModel } from '../../models/foodType';

describe('POST /api/media/upload - ERROR HANDLING FOR 100% COVERAGE', () => {
  const app = createTestApp();
  let authToken: string;
  let userId: string;
  const testImagePath = path.join(__dirname, '../fixtures/images/banana1.jpg');

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
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  /**
   * Test: Handle Error exceptions during image save
   * Tests media.ts controller lines 52-60 (uploadImage error handling)
   */
  test('should handle Error exceptions during image save', async () => {
    // Mock MediaService.saveImage to throw Error
    jest.spyOn(MediaService, 'saveImage').mockRejectedValueOnce(new Error('Storage failure'));

    const response = await request(app)
      .post('/api/media/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('media', testImagePath)
      .expect(500);

    expect(response.body.message).toBe('Storage failure');

    console.log('[TEST] ✓ Handled Error exception during image save');
  });

  /**
   * Test: Handle non-Error exceptions during image save
   * Tests media.ts controller line 60 (next(error) call in uploadImage)
   */
  test('should handle non-Error exceptions during image save', async () => {
    // Mock MediaService.saveImage to throw non-Error
    jest.spyOn(MediaService, 'saveImage').mockRejectedValueOnce('string error');

    await request(app)
      .post('/api/media/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('media', testImagePath)
      .expect(500);

    console.log('[TEST] ✓ Handled non-Error exception during image save');
  });

  /**
   * Test: Handle missing file in upload request
   * Tests media.ts controller lines 20-24 (no file validation)
   */
  test('should return 400 when no file is uploaded', async () => {
    const response = await request(app)
      .post('/api/media/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(400);

    expect(response.body.message).toBe('No file uploaded');

    console.log('[TEST] ✓ Rejected upload without file');
  });
});

describe('POST /api/media/vision - ERROR HANDLING FOR 100% COVERAGE', () => {
  const app = createTestApp();
  let authToken: string;
  let userId: string;
  const testProduceImage = path.join(__dirname, '../fixtures/images/banana1.jpg');

  beforeAll(async () => {
    await dbHandler.connect();
  });

  beforeEach(async () => {
    const user = await userModel.create(mockGoogleUserInfo);
    userId = user._id.toString();
    authToken = jwt.sign({ id: userId }, process.env.JWT_SECRET!, { expiresIn: '1h' });
    jest.clearAllMocks();

    // Default mock for AI vision
    mockedAiVision.analyzeProduce.mockResolvedValue({
      isProduce: true,
      name: 'Apple',
      category: 'fruit',
      confidence: 0.95,
      nutritionalInfo: null,
      nutrients: {
        calories: 52,
        protein: 0.3,
        carbohydrates: 14,
        fat: 0.2,
      },
    });
  });

  afterEach(async () => {
    await dbHandler.clearDatabase();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  /**
   * Test: Handle FoodType creation failure
   * Tests media.ts controller lines 111-114 (foodType null check)
   */
  test('should return 500 when foodType creation fails', async () => {
    // Mock foodTypeModel.create to return null
    jest.spyOn(foodTypeModel, 'create').mockResolvedValueOnce(null);
    // Mock findByName to return null (so it tries to create)
    jest.spyOn(foodTypeModel, 'findByName').mockResolvedValueOnce(null);

    const response = await request(app)
      .post('/api/media/vision')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('media', testProduceImage)
      .expect(500);

    expect(response.body.message).toBe('Failed to find or create foodType');

    console.log('[TEST] ✓ Handled foodType creation failure');
  });

  /**
   * Test: Handle nutrients update error
   * Tests media.ts controller lines 124-134 (nutrients update catch block)
   */
  test('should continue despite nutrients update error', async () => {
    // Mock AI vision to return produce with nutrients
    mockedAiVision.analyzeProduce.mockResolvedValueOnce({
      isProduce: true,
      name: 'Apple',
      category: 'fruit',
      nutrients: {
        calories: '52',
        protein: '0.3',
        carbohydrates: '14',
        fat: '0.2',
      },
    });

    // Mock findByName to return null (forces creation)
    jest.spyOn(foodTypeModel, 'findByName').mockResolvedValueOnce(null);

    // Mock create to return a valid foodType
    const mockFoodType = {
      _id: 'test-food-type-id',
      name: 'Apple',
      nutrients: {
        calories: '52',
        protein: '0.3',
        carbohydrates: '14',
        fat: '0.2',
      },
    };
    jest.spyOn(foodTypeModel, 'create').mockResolvedValueOnce(mockFoodType as any);

    // Mock update to throw error
    jest.spyOn(foodTypeModel, 'update').mockRejectedValueOnce(new Error('Update failed'));

    // Mock findById to return null (so it doesn't refresh)
    jest.spyOn(foodTypeModel, 'findById').mockResolvedValueOnce(null);

    // Mock foodItem creation
    const mockFoodItem = {
      _id: 'test-food-item-id',
      userId: userId,
      typeId: 'test-food-type-id',
      expirationDate: new Date(),
      percentLeft: 100,
    };
    jest.spyOn(foodItemModel, 'create').mockResolvedValueOnce(mockFoodItem as any);

    // Should still succeed and create food item
    const response = await request(app)
      .post('/api/media/vision')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('media', testProduceImage)
      .expect(200);

    expect(response.body.message).toBe('Produce item added to fridge');

    console.log('[TEST] ✓ Continued despite nutrients update error');
  });

  /**
   * Test: Handle Error exceptions during vision scan
   * Tests media.ts controller error handling in visionScan
   */
  test('should handle Error exceptions during vision scan', async () => {
    // Mock MediaService.saveImage to throw Error
    jest.spyOn(MediaService, 'saveImage').mockRejectedValueOnce(new Error('Vision storage failed'));

    const response = await request(app)
      .post('/api/media/vision')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('media', testProduceImage)
      .expect(500);

    expect(response.body.message).toBe('Vision storage failed');

    console.log('[TEST] ✓ Handled Error exception during vision scan');
  });

  /**
   * Test: Handle non-Error exceptions during vision scan
   * Tests media.ts controller line 161 (next(error) call in visionScan)
   */
  test('should handle non-Error exceptions during vision scan', async () => {
    // Mock MediaService.saveImage to throw non-Error
    jest.spyOn(MediaService, 'saveImage').mockRejectedValueOnce('string error');

    await request(app)
      .post('/api/media/vision')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('media', testProduceImage)
      .expect(500);

    console.log('[TEST] ✓ Handled non-Error exception during vision scan');
  });

  /**
   * Test: Handle missing file in vision request
   * Tests media.ts controller lines 70-72 (no file validation in visionScan)
   */
  test('should return 400 when no file is uploaded for vision scan', async () => {
    const response = await request(app)
      .post('/api/media/vision')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(400);

    expect(response.body.message).toBe('No file uploaded');

    console.log('[TEST] ✓ Rejected vision scan without file');
  });

  /**
   * Test: Handle AI service error
   * Tests error handling when AI vision service fails
   */
  test('should handle AI service errors', async () => {
    // Mock AI service to throw error
    mockedAiVision.analyzeProduce.mockRejectedValueOnce(new Error('AI service unavailable'));

    const response = await request(app)
      .post('/api/media/vision')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('media', testProduceImage)
      .expect(500);

    expect(response.body.message).toBe('AI service unavailable');

    console.log('[TEST] ✓ Handled AI service error');
  });
});

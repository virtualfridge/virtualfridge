// /**
//  * FoodItem Controller API Tests
//  *
//  * Tests for all food item management endpoints
//  */

// import { describe, expect, test, jest, beforeAll, afterAll, afterEach } from '@jest/globals';
// import request from 'supertest';
// import jwt from 'jsonwebtoken';
// import mongoose from 'mongoose';
// import { createTestApp } from '../helpers/testApp';
// import * as dbHandler from '../helpers/dbHandler';
// import { userModel } from '../../models/user';
// import { foodTypeModel } from '../../models/foodType';
// import { foodItemModel } from '../../models/foodItem';
// import { mockGoogleUserInfo, mockFoodType } from '../helpers/testData';

// /**
//  * =============================================================================
//  * TEST SUITE FOR: POST /api/food-item
//  * =============================================================================
//  */

// describe('POST /api/food-item - WITHOUT MOCKING', () => {
//   const app = createTestApp();
//   let authToken: string;
//   let userId: string;
//   let foodTypeId: string;

//   beforeAll(async () => {
//     await dbHandler.connect();
//   });

//   beforeEach(async () => {
//     // Create test user and food type before each test
//     const user = await userModel.create(mockGoogleUserInfo);
//     userId = user._id.toString();
//     authToken = jwt.sign({ id: userId }, process.env.JWT_SECRET!, { expiresIn: '1h' });

//     const foodType = await foodTypeModel.create(mockFoodType);
//     foodTypeId = foodType._id.toString();
//   });

//   afterEach(async () => {
//     await dbHandler.clearDatabase();
//   });

//   afterAll(async () => {
//     await dbHandler.closeDatabase();
//   });

//   /**
//    * Test: Create food item with valid authentication
//    *
//    * Input:
//    * - HTTP Method: POST
//    * - Endpoint: /api/food-item
//    * - Headers: Authorization: Bearer <valid JWT token>
//    * - Body: { userId, typeId, expirationDate, percentLeft }
//    *
//    * Expected Status Code: 200
//    *
//    * Expected Output:
//    * - Response body contains 'message' property
//    * - Response body contains 'data.foodItem' with created food item
//    * - foodItem has valid _id
//    * - percentLeft matches input (100)
//    *
//    * Expected Behavior:
//    * - Food item is created in database with provided details
//    * - JWT token is validated successfully
//    * - Response includes the created food item object
//    *
//    * Mocking: NONE (uses real in-memory database)
//    */
//   test('should create food item with authentication', async () => {
//     const foodItemData = {
//       userId: userId,
//       typeId: foodTypeId,
//       expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
//       percentLeft: 100,
//     };

//     const response = await request(app)
//       .post('/api/food-item')
//       .set('Authorization', `Bearer ${authToken}`)
//       .send(foodItemData)
//       .expect(200);

//     expect(response.body).toHaveProperty('message');
//     expect(response.body).toHaveProperty('data');
//     expect(response.body.data).toHaveProperty('foodItem');
//     expect(response.body.data.foodItem).toHaveProperty('_id');
//     expect(response.body.data.foodItem.percentLeft).toBe(100);
//   });

//   /**
//    * Test: Reject request without authentication token
//    *
//    * Input:
//    * - HTTP Method: POST
//    * - Endpoint: /api/food-item
//    * - Headers: NONE (no Authorization header)
//    * - Body: { userId, typeId, expirationDate, percentLeft }
//    *
//    * Expected Status Code: 401
//    *
//    * Expected Output:
//    * - Unauthorized error response
//    *
//    * Expected Behavior:
//    * - Request is rejected before reaching controller
//    * - Authentication middleware blocks the request
//    * - No food item is created in database
//    *
//    * Mocking: NONE
//    */
//   test('should return 401 without authentication token', async () => {
//     const foodItemData = {
//       userId: new mongoose.Types.ObjectId(userId),
//       typeId: new mongoose.Types.ObjectId(foodTypeId),
//       expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
//       percentLeft: 100,
//     };

//     await request(app)
//       .post('/api/food-item')
//       .send(foodItemData)
//       .expect(401);
//   });

//   /**
//    * Test: Reject request with invalid JWT token
//    *
//    * Input:
//    * - HTTP Method: POST
//    * - Endpoint: /api/food-item
//    * - Headers: Authorization: Bearer invalid-token
//    * - Body: { userId, typeId, expirationDate, percentLeft }
//    *
//    * Expected Status Code: 401
//    *
//    * Expected Output:
//    * - Unauthorized error response
//    *
//    * Expected Behavior:
//    * - JWT verification fails in authentication middleware
//    * - Request is rejected before reaching controller
//    *
//    * Mocking: NONE
//    */
//   test('should return 401 with invalid token', async () => {
//     const foodItemData = {
//       userId: new mongoose.Types.ObjectId(userId),
//       typeId: new mongoose.Types.ObjectId(foodTypeId),
//       expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
//       percentLeft: 100,
//     };

//     await request(app)
//       .post('/api/food-item')
//       .set('Authorization', 'Bearer invalid-token')
//       .send(foodItemData)
//       .expect(401);
//   });
// });

// describe('POST /api/food-item - WITH MOCKING', () => {
//   const app = createTestApp();
//   let authToken: string;
//   let userId: string;
//   let foodTypeId: string;

//   beforeAll(async () => {
//     await dbHandler.connect();
//   });

//   beforeEach(async () => {
//     const user = await userModel.create(mockGoogleUserInfo);
//     userId = user._id.toString();
//     authToken = jwt.sign({ id: userId }, process.env.JWT_SECRET!, { expiresIn: '1h' });

//     const foodType = await foodTypeModel.create(mockFoodType);
//     foodTypeId = foodType._id.toString();
//   });

//   afterEach(async () => {
//     await dbHandler.clearDatabase();
//     jest.clearAllMocks();
//   });

//   afterAll(async () => {
//     await dbHandler.closeDatabase();
//   });

//   /**
//    * Test: Handle database Error exceptions during creation
//    *
//    * Input:
//    * - HTTP Method: POST
//    * - Endpoint: /api/food-item
//    * - Headers: Authorization: Bearer <valid JWT token>
//    * - Body: { userId, typeId, expirationDate, percentLeft }
//    *
//    * Expected Status Code: 500
//    *
//    * Expected Output:
//    * - Response body contains 'message' property with error message
//    * - Error message is 'Database error' (from mocked rejection)
//    *
//    * Expected Behavior:
//    * - Controller catches the Error thrown by foodItemModel.create()
//    * - Returns 500 status code with error message
//    * - Error is logged
//    *
//    * Mocking:
//    * - Mock: foodItemModel.create() method
//    * - Mock Behavior: Reject promise with Error('Database error')
//    * - Mock Purpose: Simulate database connection failure
//    */
//   test('should handle Error exceptions during creation', async () => {
//     jest.spyOn(foodItemModel, 'create').mockRejectedValueOnce(new Error('Database error'));

//     const foodItemData = {
//       userId: new mongoose.Types.ObjectId(userId),
//       typeId: new mongoose.Types.ObjectId(foodTypeId),
//       expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
//       percentLeft: 100,
//     };

//     const response = await request(app)
//       .post('/api/food-item')
//       .set('Authorization', `Bearer ${authToken}`)
//       .send(foodItemData)
//       .expect(500);

//     expect(response.body).toHaveProperty('message');
//     expect(response.body.message).toBe('Database error');
//   });

//   /**
//    * Test: Handle non-Error exceptions during creation
//    *
//    * Input:
//    * - HTTP Method: POST
//    * - Endpoint: /api/food-item
//    * - Headers: Authorization: Bearer <valid JWT token>
//    * - Body: { userId, typeId, expirationDate, percentLeft }
//    *
//    * Expected Status Code: 500
//    *
//    * Expected Output:
//    * - 500 Internal Server Error
//    *
//    * Expected Behavior:
//    * - Controller catches the non-Error exception (string)
//    * - Passes exception to error handling middleware
//    * - Returns 500 status code
//    *
//    * Mocking:
//    * - Mock: foodItemModel.create() method
//    * - Mock Behavior: Reject promise with string 'string error'
//    * - Mock Purpose: Test handling of non-Error exceptions (edge case)
//    */
//   test('should handle non-Error exceptions during creation', async () => {
//     jest.spyOn(foodItemModel, 'create').mockRejectedValueOnce('string error');

//     const foodItemData = {
//       userId: new mongoose.Types.ObjectId(userId),
//       typeId: new mongoose.Types.ObjectId(foodTypeId),
//       expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
//       percentLeft: 100,
//     };

//     await request(app)
//       .post('/api/food-item')
//       .set('Authorization', `Bearer ${authToken}`)
//       .send(foodItemData)
//       .expect(500);
//   });
// });

// /**
//  * =============================================================================
//  * TEST SUITE FOR: PUT /api/food-item
//  * =============================================================================
//  */

// describe('PUT /api/food-item - WITHOUT MOCKING', () => {
//   const app = createTestApp();
//   let authToken: string;
//   let userId: string;
//   let foodTypeId: string;

//   beforeAll(async () => {
//     await dbHandler.connect();
//   });

//   beforeEach(async () => {
//     const user = await userModel.create(mockGoogleUserInfo);
//     userId = user._id.toString();
//     authToken = jwt.sign({ id: userId }, process.env.JWT_SECRET!, { expiresIn: '1h' });

//     const foodType = await foodTypeModel.create(mockFoodType);
//     foodTypeId = foodType._id.toString();
//   });

//   afterEach(async () => {
//     await dbHandler.clearDatabase();
//   });

//   afterAll(async () => {
//     await dbHandler.closeDatabase();
//   });

//   /**
//    * Test: Update food item successfully
//    *
//    * Input:
//    * - HTTP Method: PUT
//    * - Endpoint: /api/food-item
//    * - Headers: Authorization: Bearer <valid JWT token>
//    * - Body: { _id, percentLeft: 50, expirationDate }
//    *
//    * Expected Status Code: 200
//    *
//    * Expected Output:
//    * - Response body contains 'message' property
//    * - Response body contains updated foodItem with percentLeft = 50
//    *
//    * Expected Behavior:
//    * - Existing food item is found by _id
//    * - Item is updated with new values
//    * - Updated item is returned in response
//    *
//    * Mocking: NONE
//    */
//   test('should update food item successfully', async () => {
//     // Create a food item first
//     const foodItem = await foodItemModel.create({
//       userId: new mongoose.Types.ObjectId(userId),
//       typeId: new mongoose.Types.ObjectId(foodTypeId),
//       expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
//       percentLeft: 100,
//     });

//     const updates = {
//       _id: foodItem._id,
//       percentLeft: 50,
//       expirationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
//     };

//     const response = await request(app)
//       .put('/api/food-item')
//       .set('Authorization', `Bearer ${authToken}`)
//       .send(updates)
//       .expect(200);

//     expect(response.body).toHaveProperty('message');
//     expect(response.body.data.foodItem.percentLeft).toBe(50);
//   });

//   /**
//    * Test: Return 404 for non-existent food item
//    *
//    * Input:
//    * - HTTP Method: PUT
//    * - Endpoint: /api/food-item
//    * - Headers: Authorization: Bearer <valid JWT token>
//    * - Body: { _id: <non-existent ObjectId>, percentLeft: 50 }
//    *
//    * Expected Status Code: 404
//    *
//    * Expected Output:
//    * - Response body contains 'message' property with 'not found' text
//    *
//    * Expected Behavior:
//    * - Database query for the _id returns null
//    * - Controller returns 404 with appropriate error message
//    *
//    * Mocking: NONE
//    */
//   test('should return 404 for non-existent food item', async () => {
//     const fakeId = new mongoose.Types.ObjectId();

//     const response = await request(app)
//       .put('/api/food-item')
//       .set('Authorization', `Bearer ${authToken}`)
//       .send({
//         _id: fakeId,
//         percentLeft: 50,
//       })
//       .expect(404);

//     expect(response.body).toHaveProperty('message');
//     expect(response.body.message).toContain('not found');
//   });
// });

// describe('PUT /api/food-item - WITH MOCKING', () => {
//   const app = createTestApp();
//   let authToken: string;
//   let userId: string;

//   beforeAll(async () => {
//     await dbHandler.connect();
//   });

//   beforeEach(async () => {
//     const user = await userModel.create(mockGoogleUserInfo);
//     userId = user._id.toString();
//     authToken = jwt.sign({ id: userId }, process.env.JWT_SECRET!, { expiresIn: '1h' });
//   });

//   afterEach(async () => {
//     await dbHandler.clearDatabase();
//     jest.clearAllMocks();
//   });

//   afterAll(async () => {
//     await dbHandler.closeDatabase();
//   });

//   /**
//    * Test: Handle database Error during update
//    *
//    * Input:
//    * - HTTP Method: PUT
//    * - Endpoint: /api/food-item
//    * - Headers: Authorization: Bearer <valid JWT token>
//    * - Body: { _id, percentLeft: 50 }
//    *
//    * Expected Status Code: 500
//    *
//    * Expected Output:
//    * - Response body contains error message 'Database error'
//    *
//    * Expected Behavior:
//    * - foodItemModel.update() throws an Error
//    * - Controller catches the error and returns 500
//    * - Error is logged
//    *
//    * Mocking:
//    * - Mock: foodItemModel.update() method
//    * - Mock Behavior: Reject with Error('Database error')
//    * - Mock Purpose: Simulate database update failure
//    */
//   test('should handle Error exceptions during update', async () => {
//     jest.spyOn(foodItemModel, 'update').mockRejectedValueOnce(new Error('Database error'));

//     const response = await request(app)
//       .put('/api/food-item')
//       .set('Authorization', `Bearer ${authToken}`)
//       .send({
//         _id: new mongoose.Types.ObjectId(),
//         percentLeft: 50,
//       })
//       .expect(500);

//     expect(response.body).toHaveProperty('message');
//     expect(response.body.message).toBe('Database error');
//   });
// });

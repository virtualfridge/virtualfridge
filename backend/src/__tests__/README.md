# Backend Test Suite

This directory contains the Jest-based test suite for the Virtual Fridge backend, structured to focus on **API testing** with comprehensive coverage of all externally triggered backend APIs.

## Test Structure

The testing framework is organized into three categories:

```
__tests__/
├── api-mocked/          # API tests WITH external dependency mocking
├── api-unmocked/        # API tests WITHOUT additional mocking
├── additional/          # Unit tests for services, models, utilities
└── helpers/             # Test utilities and setup
```

### 1. API Tests (api-mocked/ and api-unmocked/)

**Focus**: All externally triggered backend APIs exposed to the frontend or third-party services.

Each API endpoint has TWO test files:
- **api-unmocked**: Tests where external components can be triggered and will perform as expected (only Google OAuth is mocked as it's required)
- **api-mocked**: Tests that mock external dependencies to simulate behaviors we cannot fully control (database errors, API failures, etc.)

**Current API Coverage**:
- ✅ `/api/auth/*` - Authentication endpoints (Google OAuth, sign up, sign in)
- ✅ `/api/user/*` - User profile management
- ✅ `/api/media/*` - Media upload and vision scanning
- ✅ `/api/fridge/*` - Fridge items and barcode scanning
- ✅ `/api/food-item/*` - Food item CRUD operations
- ✅ `/api/food-type/*` - Food type CRUD operations
- ✅ `/api/recipes/*` - Recipe generation with AI
- ✅ `/api/notifications/admin/*` - Notification admin/testing endpoints

Each test is annotated with:
- Input (HTTP method, endpoint, headers, body)
- Expected status code
- Expected output
- Expected behavior
- Mocking information (what's mocked and why)

### 2. Additional Tests (additional/)

**Focus**: Unit tests for services, models, utilities, and middleware that are not API endpoints.

```
additional/
├── services/     # Business logic unit tests
├── models/       # Database model tests
├── middleware/   # Middleware unit tests
├── util/         # Utility function tests
└── examples/     # Example/comprehensive tests
```

## Running Tests

### Run All Tests
```bash
npm test                    # Run all tests (API + additional)
npm run test:coverage       # Run all tests with coverage report
npm run test:verbose        # Run all tests with verbose output
```

### Run API Tests Only
```bash
npm run test:api                     # Run both mocked and unmocked API tests
npm run test:coverage:api            # Run API tests with coverage
```

### Run Specific Test Categories
```bash
# API tests with mocking
npm run test:api-mocked
npm run test:coverage:api-mocked

# API tests without additional mocking
npm run test:api-unmocked
npm run test:coverage:api-unmocked

# Additional unit tests
npm run test:additional
npm run test:coverage:additional
```

### Watch Mode
```bash
npm run test:watch                   # Watch all tests
npm run test:watch:api-mocked        # Watch API mocked tests
npm run test:watch:api-unmocked      # Watch API unmocked tests
npm run test:watch:additional        # Watch additional tests
```

### Run Specific Test File
```bash
npm test -- src/__tests__/api-unmocked/auth.test.ts
npm test -- --testNamePattern="should create user"
```

## Test Types Explained

### API Tests - WITHOUT ADDITIONAL MOCKING (api-unmocked/)

Tests where we can trigger external components and they perform as expected. The only mock is Google OAuth (required because we can't make real calls to Google's API).

**Example**: Testing user creation flow
- Real database operations (MongoDB in-memory)
- Real JWT token generation
- Real validation logic
- Mock only: Google OAuth verification

**Structure**:
```typescript
describe('POST /api/auth/google - WITHOUT ADDITIONAL MOCKING', () => {
  test('should login existing user successfully', async () => {
    // Input: POST /api/auth/google with valid idToken
    // Expected Status: 200
    // Expected Output: JWT token and user object
    // Expected Behavior: Verify token, find user, return JWT
    // Mocking: Google OAuth2Client only
  });
});
```

### API Tests - WITH ADDITIONAL MOCKING (api-mocked/)

Tests that mock external dependencies to simulate edge cases and error scenarios we cannot fully control.

**Example**: Testing database failure during user creation
- Mock database operations to throw errors
- Mock external API calls (OpenFoodFacts, Gemini AI)
- Test error handling paths

**Structure**:
```typescript
describe('POST /api/auth/signup - WITH ADDITIONAL MOCKING', () => {
  test('should return 500 for database failure', async () => {
    // Input: POST /api/auth/signup with valid data
    // Expected Status: 500
    // Expected Output: Error message
    // Expected Behavior: Catch database error, return 500
    // Mocking: userModel.create() - rejects with error
  });
});
```

### Additional Tests

Unit tests for non-API components:
- **Services**: Business logic, external integrations (AI, auth)
- **Models**: Database operations, validation
- **Middleware**: Authentication, error handling, validation
- **Utilities**: Helper functions, date parsing, logging

## Test Helpers

### dbHandler.ts
MongoDB memory server lifecycle management:
- `connect()` - Start in-memory MongoDB
- `clearDatabase()` - Clear all collections
- `closeDatabase()` - Stop MongoDB and close connection

**Usage**:
```typescript
beforeAll(async () => {
  await dbHandler.connect();
});

afterEach(async () => {
  await dbHandler.clearDatabase();
});

afterAll(async () => {
  await dbHandler.closeDatabase();
});
```

### testData.ts
Mock data for tests:
- `mockUser` - Sample user object
- `mockGoogleUserInfo` - Google OAuth user info
- `mockFoodType` - Sample food type
- `mockFoodItem()` - Factory for food items

### testApp.ts
Creates Express app instance for integration testing:
- Includes all routes and middleware
- Does not start actual server
- Used with supertest for HTTP testing

## Mocking External Dependencies

### Google Auth (Required for all API tests)
```typescript
const mockVerifyIdToken = jest.fn();
jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: mockVerifyIdToken,
  })),
}));
```

### Axios (OpenFoodFacts, external APIs)
```typescript
import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.get.mockResolvedValue({ data: mockResponse });
```

### Database Operations
```typescript
jest.spyOn(userModel, 'create').mockRejectedValueOnce(new Error('DB error'));
```

## Coverage Goals

The testing strategy aims for **near 100% code coverage** through API tests:

- **API tests (mocked + unmocked)** should cover:
  - All HTTP endpoints
  - All request/response paths
  - Error handling scenarios
  - Authentication flows
  - Validation logic

- **Additional tests** supplement with:
  - Service business logic
  - Model operations
  - Utility functions

### Generate Coverage Report
```bash
npm run test:coverage        # All tests
npm run test:coverage:api    # API tests only
```

Coverage reports:
- `coverage/lcov-report/index.html` - HTML report
- `coverage/lcov.info` - LCOV format for CI tools
- `coverage/api-mocked/` - API mocked tests coverage
- `coverage/api-unmocked/` - API unmocked tests coverage
- `coverage/additional/` - Additional tests coverage

### Coverage Configuration

Exclusions (configured in `jest.config.js`):
- Type definition files (`**/*.d.ts`)
- Main entry point (`src/index.ts`)
- Type directories (`src/types/**`)

## Writing New Tests

### API Test Template (Unmocked)
```typescript
import { describe, expect, test, beforeAll, afterAll, afterEach } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createTestApp } from '../helpers/testApp';
import * as dbHandler from '../helpers/dbHandler';

/**
 * =============================================================================
 * TEST SUITE FOR: GET /api/your-endpoint
 * =============================================================================
 */

describe('GET /api/your-endpoint - WITHOUT ADDITIONAL MOCKING', () => {
  const app = createTestApp();
  let authToken: string;

  beforeAll(async () => {
    await dbHandler.connect();
  });

  beforeEach(async () => {
    // Setup auth token
    const user = await userModel.create(mockUser);
    authToken = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET!);
  });

  afterEach(async () => {
    await dbHandler.clearDatabase();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  /**
   * Test: Description of what this tests
   *
   * Input:
   * - HTTP Method: GET
   * - Endpoint: /api/your-endpoint
   * - Headers: Authorization: Bearer <token>
   * - Body: None
   *
   * Expected Status Code: 200
   *
   * Expected Output:
   * - Response contains expected data
   *
   * Expected Behavior:
   * - Service performs expected actions
   *
   * Mocking:
   * - None (uses real database)
   */
  test('should do something', async () => {
    const response = await request(app)
      .get('/api/your-endpoint')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body).toBeDefined();
  });
});
```

### API Test Template (Mocked)
```typescript
import { describe, expect, test, jest, beforeAll, afterAll, afterEach } from '@jest/globals';
import request from 'supertest';
import { createTestApp } from '../helpers/testApp';
import * as dbHandler from '../helpers/dbHandler';

// Setup mocks
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('POST /api/your-endpoint - WITH ADDITIONAL MOCKING', () => {
  const app = createTestApp();

  beforeAll(async () => {
    await dbHandler.connect();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await dbHandler.clearDatabase();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  /**
   * Test: Handle external API failure
   *
   * Input:
   * - HTTP Method: POST
   * - Endpoint: /api/your-endpoint
   * - Body: { data: 'test' }
   *
   * Expected Status Code: 500
   *
   * Expected Output:
   * - Error message
   *
   * Expected Behavior:
   * - External API call fails
   * - Error is caught and handled
   *
   * Mocking:
   * - Mock: axios.get()
   * - Mock Behavior: Rejects with network error
   * - Mock Purpose: Simulate external API failure
   */
  test('should handle API failure', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

    const response = await request(app)
      .post('/api/your-endpoint')
      .send({ data: 'test' })
      .expect(500);

    expect(response.body.message).toBeDefined();
  });
});
```

## Environment Variables

Tests use the same `.env` file as development. Required variables:
- `JWT_SECRET` - For token generation in tests
- `GOOGLE_CLIENT_ID` - For auth mocking
- `MONGODB_URI` - (Overridden by in-memory DB in tests)

## Troubleshooting

### Tests timeout
Increase timeout in `jest.config.js`:
```javascript
testTimeout: 30000, // 30 seconds
```

### Memory leaks
Use `--detectOpenHandles` to find open handles:
```bash
npm test -- --detectOpenHandles
```

### Database connection issues
Ensure MongoDB memory server is properly closed:
```typescript
afterAll(async () => {
  await dbHandler.closeDatabase();
});
```

### Mock not working
Clear mocks between tests:
```typescript
beforeEach(() => {
  jest.clearAllMocks();
});
```

## Best Practices

1. **Test real behavior first** - Use api-unmocked/ for happy paths
2. **Mock only what you need** - Only mock external dependencies you can't control
3. **Annotate thoroughly** - Include all test metadata (inputs, outputs, mocking)
4. **Test error paths** - Use api-mocked/ for error scenarios
5. **Keep tests isolated** - Clear database between tests
6. **Use descriptive names** - Test names should describe what they're testing
7. **Follow the template** - Use consistent structure across all tests

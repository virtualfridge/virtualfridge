/** @type {import('jest').Config} */
const baseConfig = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/types/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  testTimeout: 10000,
  setupFiles: ['<rootDir>/src/__tests__/setup.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        diagnostics: false,
        tsconfig: {
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          skipLibCheck: true,
        },
      },
    ],
  },
};

// Test files that use jest.mock() - these are "mocked" tests
const mockedTestFiles = [
  'src/__tests__/controllers/notification.test.ts',
  'src/__tests__/controllers/auth.test.ts',
  'src/__tests__/controllers/notificationUnit.test.ts',
  'src/__tests__/controllers/media.test.ts',
  'src/__tests__/controllers/user.test.ts',
  'src/__tests__/controllers/recipe.test.ts',
  'src/__tests__/util/storage.test.ts',
  'src/__tests__/util/database.test.ts',
  'src/__tests__/middleware/auth.test.ts',
  'src/__tests__/services/notification.test.ts',
  'src/__tests__/services/media.test.ts',
  'src/__tests__/services/fridge.test.ts',
  'src/__tests__/services/aiVision.test.ts',
  'src/__tests__/services/auth.test.ts',
  'src/__tests__/services/aiRecipe.test.ts',
  'src/__tests__/examples/comprehensive.test.ts',
];

// Test files that DON'T use jest.mock() - these are "unmocked" tests
const unmockedTestFiles = [
  'src/__tests__/controllers/foodItem.test.ts',
  'src/__tests__/controllers/foodType.test.ts',
  'src/__tests__/controllers/hobby.test.ts',
  'src/__tests__/controllers/simple.test.ts',
  'src/__tests__/middleware/errorHandler.test.ts',
  'src/__tests__/middleware/validation.test.ts',
  'src/__tests__/models/foodItem.test.ts',
  'src/__tests__/models/foodType.test.ts',
  'src/__tests__/models/user.test.ts',
  'src/__tests__/util/dates.test.ts',
];

module.exports = {
  projects: [
    {
      ...baseConfig,
      roots: undefined,
      displayName: 'mocked',
      testMatch: mockedTestFiles.map(f => `<rootDir>/${f}`),
      coverageDirectory: 'coverage/mocked',
    },
    {
      ...baseConfig,
      roots: undefined,
      displayName: 'unmocked',
      testMatch: unmockedTestFiles.map(f => `<rootDir>/${f}`),
      coverageDirectory: 'coverage/unmocked',
    },
  ],
};

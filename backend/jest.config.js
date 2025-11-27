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

module.exports = {
  projects: [
    {
      ...baseConfig,
      displayName: 'api-mocked',
      testMatch: ['<rootDir>/src/__tests__/api-mocked/**/*.test.ts'],
      coverageDirectory: 'coverage/api-mocked',
    },
    {
      ...baseConfig,
      displayName: 'api-unmocked',
      testMatch: ['<rootDir>/src/__tests__/api-unmocked/**/*.test.ts'],
      coverageDirectory: 'coverage/api-unmocked',
    },
    {
      ...baseConfig,
      displayName: 'unit',
      testMatch: ['<rootDir>/src/__tests__/unit/**/*.test.ts'],
      coverageDirectory: 'coverage/unit',
    },
  ],
};

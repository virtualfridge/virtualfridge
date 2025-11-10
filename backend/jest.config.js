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
      displayName: 'mocked',
      testMatch: ['<rootDir>/src/__tests__/mocked/**/*.test.ts'],
      coverageDirectory: 'coverage/mocked',
    },
    {
      ...baseConfig,
      displayName: 'unmocked',
      testMatch: ['<rootDir>/src/__tests__/unmocked/**/*.test.ts'],
      coverageDirectory: 'coverage/unmocked',
    },
  ],
};

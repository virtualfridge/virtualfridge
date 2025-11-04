import { describe, expect, test, jest, beforeEach, afterEach } from '@jest/globals';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../../util/database';

// Mock mongoose
jest.mock('mongoose', () => ({
  connect: jest.fn(),
  connection: {
    close: jest.fn(),
    on: jest.fn(),
  },
}));

const mockedMongoose = mongoose as jest.Mocked<typeof mongoose>;

describe('database utility', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

  beforeEach(() => {
    jest.clearAllMocks();
    originalEnv = { ...process.env };
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    // Reset process.exitCode
    process.exitCode = undefined;
  });

  afterEach(() => {
    process.env = originalEnv;
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('connectDB', () => {
    test('should connect to MongoDB successfully with credentials', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/testdb';
      process.env.MONGODB_USER = 'testuser';
      process.env.MONGODB_PASS = 'testpass';

      mockedMongoose.connect = jest.fn().mockResolvedValue(mongoose);
      mockedMongoose.connection = {
        on: jest.fn(),
        close: jest.fn(),
      } as any;

      await connectDB();

      expect(mockedMongoose.connect).toHaveBeenCalledWith(
        'mongodb://localhost:27017/testdb',
        {
          auth: {
            username: 'testuser',
            password: 'testpass',
          },
          authSource: 'admin',
        }
      );
      expect(consoleLogSpy).toHaveBeenCalledWith('✅ MongoDB connected successfully');
    });

    test('should set up error event listener', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/testdb';
      process.env.MONGODB_USER = 'testuser';
      process.env.MONGODB_PASS = 'testpass';

      mockedMongoose.connect = jest.fn().mockResolvedValue(mongoose);
      const onMock = jest.fn();
      mockedMongoose.connection = {
        on: onMock,
        close: jest.fn(),
      } as any;

      await connectDB();

      expect(onMock).toHaveBeenCalledWith('error', expect.any(Function));

      // Test the error handler
      const errorHandler = onMock.mock.calls.find(call => call[0] === 'error')?.[1];
      if (errorHandler) {
        const testError = new Error('Connection error');
        errorHandler(testError);
        expect(consoleErrorSpy).toHaveBeenCalledWith('❌ MongoDB connection error:', testError);
      }
    });

    test('should set up disconnected event listener', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/testdb';
      process.env.MONGODB_USER = 'testuser';
      process.env.MONGODB_PASS = 'testpass';

      mockedMongoose.connect = jest.fn().mockResolvedValue(mongoose);
      const onMock = jest.fn();
      mockedMongoose.connection = {
        on: onMock,
        close: jest.fn(),
      } as any;

      await connectDB();

      expect(onMock).toHaveBeenCalledWith('disconnected', expect.any(Function));

      // Test the disconnected handler
      const disconnectHandler = onMock.mock.calls.find(call => call[0] === 'disconnected')?.[1];
      if (disconnectHandler) {
        disconnectHandler();
        expect(consoleLogSpy).toHaveBeenCalledWith('⚠️ MongoDB disconnected');
      }
    });

    test('should set up SIGINT handler for graceful shutdown', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/testdb';
      process.env.MONGODB_USER = 'testuser';
      process.env.MONGODB_PASS = 'testpass';

      mockedMongoose.connect = jest.fn().mockResolvedValue(mongoose);
      const closeMock = jest.fn().mockResolvedValue(undefined);
      mockedMongoose.connection = {
        on: jest.fn(),
        close: closeMock,
      } as any;

      // Spy on process.on
      const processOnSpy = jest.spyOn(process, 'on');

      await connectDB();

      expect(processOnSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function));

      // Test the SIGINT handler
      const sigintHandler = processOnSpy.mock.calls.find(call => call[0] === 'SIGINT')?.[1];
      if (sigintHandler && typeof sigintHandler === 'function') {
        await sigintHandler();
        expect(closeMock).toHaveBeenCalled();
        expect(consoleLogSpy).toHaveBeenCalledWith('MongoDB connection closed through app termination');
        expect(process.exitCode).toBe(0);
      }

      processOnSpy.mockRestore();
    });

    test('should handle connection errors', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/testdb';
      process.env.MONGODB_USER = 'testuser';
      process.env.MONGODB_PASS = 'testpass';

      const connectionError = new Error('Connection failed');
      mockedMongoose.connect = jest.fn().mockRejectedValue(connectionError);

      await connectDB();

      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Failed to connect to MongoDB:', connectionError);
      expect(process.exitCode).toBe(1);
    });

    test('should handle missing environment variables', async () => {
      // Clear environment variables
      delete process.env.MONGODB_URI;
      delete process.env.MONGODB_USER;
      delete process.env.MONGODB_PASS;

      mockedMongoose.connect = jest.fn().mockResolvedValue(mongoose);
      mockedMongoose.connection = {
        on: jest.fn(),
        close: jest.fn(),
      } as any;

      await connectDB();

      // Should still attempt to connect with undefined values
      expect(mockedMongoose.connect).toHaveBeenCalled();
    });

    test('should handle network timeout errors', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/testdb';
      process.env.MONGODB_USER = 'testuser';
      process.env.MONGODB_PASS = 'testpass';

      const timeoutError = new Error('Network timeout');
      mockedMongoose.connect = jest.fn().mockRejectedValue(timeoutError);

      await connectDB();

      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Failed to connect to MongoDB:', timeoutError);
      expect(process.exitCode).toBe(1);
    });
  });

  describe('disconnectDB', () => {
    test('should disconnect from MongoDB successfully', async () => {
      const closeMock = jest.fn().mockResolvedValue(undefined);
      mockedMongoose.connection = {
        close: closeMock,
        on: jest.fn(),
      } as any;

      await disconnectDB();

      expect(closeMock).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith('✅ MongoDB disconnected successfully');
    });

    test('should handle disconnection errors', async () => {
      const disconnectError = new Error('Disconnection failed');
      const closeMock = jest.fn().mockRejectedValue(disconnectError);
      mockedMongoose.connection = {
        close: closeMock,
        on: jest.fn(),
      } as any;

      await disconnectDB();

      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Error disconnecting from MongoDB:', disconnectError);
    });

    test('should handle when connection is already closed', async () => {
      const closeMock = jest.fn().mockResolvedValue(undefined);
      mockedMongoose.connection = {
        close: closeMock,
        on: jest.fn(),
      } as any;

      await disconnectDB();

      expect(closeMock).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith('✅ MongoDB disconnected successfully');
    });
  });
});

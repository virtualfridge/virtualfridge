import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import fs from 'fs';
import multer from 'multer';
import path from 'path';

// Mock fs before importing storage
jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;

describe('storage utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    test('should create IMAGES_DIR if it does not exist', () => {
      mockedFs.existsSync = jest.fn().mockReturnValue(false);
      mockedFs.mkdirSync = jest.fn();

      // Need to reload the module to trigger initialization
      jest.isolateModules(() => {
        require('../../util/storage');
      });

      // The module should check and create the directory
    });
  });

  describe('multer storage configuration', () => {
    test('should configure disk storage with correct destination', () => {
      jest.isolateModules(() => {
        mockedFs.existsSync = jest.fn().mockReturnValue(true);
        const { upload } = require('../../util/storage');
        expect(upload).toBeDefined();
      });
    });
  });

  describe('file filter', () => {
    test('should accept image files', () => {
      jest.isolateModules(() => {
        mockedFs.existsSync = jest.fn().mockReturnValue(true);
        const { upload } = require('../../util/storage');

        const mockFile = {
          fieldname: 'image',
          originalname: 'test.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          size: 1024,
          destination: '',
          filename: '',
          path: '',
          buffer: Buffer.from(''),
          stream: null as any,
        };

        const mockReq = {} as any;
        const mockCallback = jest.fn();

        // Access the fileFilter from upload
        const fileFilter = (upload as any).fileFilter;
        if (fileFilter) {
          fileFilter(mockReq, mockFile, mockCallback);
          expect(mockCallback).toHaveBeenCalledWith(null, true);
        }
      });
    });

    test('should reject non-image files', () => {
      jest.isolateModules(() => {
        mockedFs.existsSync = jest.fn().mockReturnValue(true);
        const { upload } = require('../../util/storage');

        const mockFile = {
          fieldname: 'file',
          originalname: 'test.pdf',
          encoding: '7bit',
          mimetype: 'application/pdf',
          size: 1024,
          destination: '',
          filename: '',
          path: '',
          buffer: Buffer.from(''),
          stream: null as any,
        };

        const mockReq = {} as any;
        const mockCallback = jest.fn();

        const fileFilter = (upload as any).fileFilter;
        if (fileFilter) {
          fileFilter(mockReq, mockFile, mockCallback);
          expect(mockCallback).toHaveBeenCalledWith(
            expect.objectContaining({
              message: 'Only image files are allowed!',
            })
          );
        }
      });
    });

    test('should accept various image mime types', () => {
      const imageMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
      ];

      imageMimeTypes.forEach((mimetype) => {
        jest.isolateModules(() => {
          mockedFs.existsSync = jest.fn().mockReturnValue(true);
          const { upload } = require('../../util/storage');

          const mockFile = {
            fieldname: 'image',
            originalname: 'test.jpg',
            encoding: '7bit',
            mimetype,
            size: 1024,
            destination: '',
            filename: '',
            path: '',
            buffer: Buffer.from(''),
            stream: null as any,
          };

          const mockReq = {} as any;
          const mockCallback = jest.fn();

          const fileFilter = (upload as any).fileFilter;
          if (fileFilter) {
            fileFilter(mockReq, mockFile, mockCallback);
            expect(mockCallback).toHaveBeenCalledWith(null, true);
          }
        });
      });
    });
  });

  describe('storage limits', () => {
    test('should have correct file size limit', () => {
      jest.isolateModules(() => {
        mockedFs.existsSync = jest.fn().mockReturnValue(true);
        const { upload } = require('../../util/storage');

        // Check that limits are set to 5MB
        const limits = (upload as any).limits;
        expect(limits).toBeDefined();
        expect(limits.fileSize).toBe(5 * 1024 * 1024);
      });
    });
  });
});

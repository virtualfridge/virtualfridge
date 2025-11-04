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

      // Verify that the directory was created
      expect(mockedFs.mkdirSync).toHaveBeenCalled();
    });

    test('should not create IMAGES_DIR if it already exists', () => {
      mockedFs.existsSync = jest.fn().mockReturnValue(true);
      mockedFs.mkdirSync = jest.fn();

      jest.isolateModules(() => {
        require('../../util/storage');
      });

      // Should check existence but not create
      expect(mockedFs.existsSync).toHaveBeenCalled();
      expect(mockedFs.mkdirSync).not.toHaveBeenCalled();
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

    test('should call destination callback with IMAGES_DIR', () => {
      jest.isolateModules(() => {
        mockedFs.existsSync = jest.fn().mockReturnValue(true);
        const { upload } = require('../../util/storage');
        const { IMAGES_DIR } = require('../../config/constants');

        const storage = (upload as any).storage;
        const mockReq = {} as any;
        const mockFile = {} as any;
        const mockCallback = jest.fn();

        // Call the destination callback
        storage.getDestination(mockReq, mockFile, mockCallback);

        expect(mockCallback).toHaveBeenCalledWith(null, IMAGES_DIR);
      });
    });

    test('should call filename callback with unique name and extension', () => {
      jest.isolateModules(() => {
        mockedFs.existsSync = jest.fn().mockReturnValue(true);
        const { upload } = require('../../util/storage');

        const storage = (upload as any).storage;
        const mockReq = {} as any;
        const mockFile = {
          originalname: 'test-image.jpg',
        } as any;
        const mockCallback = jest.fn();

        // Call the filename callback
        storage.getFilename(mockReq, mockFile, mockCallback);

        // Verify callback was called and filename has .jpg extension
        expect(mockCallback).toHaveBeenCalled();
        const filename = mockCallback.mock.calls[0][1];
        expect(filename).toMatch(/\.jpg$/);
      });
    });

    test('should generate unique filenames for each file', () => {
      jest.isolateModules(() => {
        mockedFs.existsSync = jest.fn().mockReturnValue(true);
        const { upload } = require('../../util/storage');

        const storage = (upload as any).storage;
        const mockReq = {} as any;
        const mockFile = {
          originalname: 'test.png',
        } as any;

        const filenames: string[] = [];

        // Generate multiple filenames
        for (let i = 0; i < 3; i++) {
          const mockCallback = jest.fn();
          storage.getFilename(mockReq, mockFile, mockCallback);
          filenames.push(mockCallback.mock.calls[0][1]);
        }

        // All filenames should be unique
        const uniqueFilenames = new Set(filenames);
        expect(uniqueFilenames.size).toBe(3);
      });
    });

    test('should preserve file extension in generated filename', () => {
      jest.isolateModules(() => {
        mockedFs.existsSync = jest.fn().mockReturnValue(true);
        const { upload } = require('../../util/storage');

        const storage = (upload as any).storage;
        const mockReq = {} as any;
        const extensions = ['.jpg', '.png', '.gif', '.webp'];

        extensions.forEach((ext) => {
          const mockFile = {
            originalname: `test${ext}`,
          } as any;
          const mockCallback = jest.fn();

          storage.getFilename(mockReq, mockFile, mockCallback);

          const filename = mockCallback.mock.calls[0][1];
          expect(filename).toMatch(new RegExp(`\\${ext}$`));
        });
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

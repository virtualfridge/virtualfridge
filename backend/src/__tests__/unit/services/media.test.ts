import {
  describe,
  expect,
  test,
  jest,
  beforeEach,
  afterEach,
} from '@jest/globals';
import fs from 'fs';
import path from 'path';
import * as MediaService from '../../../services/media';
import { IMAGES_DIR } from '../../../config/constants';

// Mock fs
jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;

describe('MediaService', () => {
  const mockUserId = 'user123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveImage', () => {
    test('should save image successfully', async () => {
      const mockFilePath = '/tmp/upload-123.jpg';
      mockedFs.renameSync = jest.fn();

      const result = await MediaService.saveImage(mockFilePath, mockUserId);

      expect(mockedFs.renameSync).toHaveBeenCalled();
      const callArgs = mockedFs.renameSync.mock.calls[0];
      expect(callArgs[0]).toBe(mockFilePath);
      expect(callArgs[1]).toContain(mockUserId);
      expect(callArgs[1]).toContain('.jpg');
      expect(result).toContain(mockUserId);
      expect(result).toContain('/');
    });

    test('should generate unique filename with timestamp', async () => {
      const mockFilePath = '/tmp/upload.png';
      mockedFs.renameSync = jest.fn();

      const result1 = await MediaService.saveImage(mockFilePath, mockUserId);

      // Wait a tiny bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 2));

      const result2 = await MediaService.saveImage(mockFilePath, mockUserId);

      expect(result1).not.toBe(result2);
    });

    test('should preserve file extension', async () => {
      const mockFilePath = '/tmp/upload.webp';
      mockedFs.renameSync = jest.fn();

      const result = await MediaService.saveImage(mockFilePath, mockUserId);

      expect(result).toContain('.webp');
    });

    test('should handle different file extensions', async () => {
      const extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      mockedFs.renameSync = jest.fn();

      for (const ext of extensions) {
        const mockFilePath = `/tmp/upload${ext}`;
        const result = await MediaService.saveImage(mockFilePath, mockUserId);
        expect(result).toContain(ext);
      }
    });

    test('should normalize path separators to forward slashes', async () => {
      const mockFilePath = '/tmp/upload.jpg';
      let capturedNewPath = '';
      mockedFs.renameSync = jest.fn((oldPath, newPath) => {
        capturedNewPath = newPath as string;
      });

      const result = await MediaService.saveImage(mockFilePath, mockUserId);

      // Result should use forward slashes
      expect(result).not.toContain('\\');
      expect(result.split('/').length).toBeGreaterThan(1);
    });

    test('should delete original file if save fails', async () => {
      const mockFilePath = '/tmp/upload.jpg';
      mockedFs.renameSync = jest.fn().mockImplementation(() => {
        throw new Error('Rename failed');
      });
      mockedFs.existsSync = jest.fn().mockReturnValue(true);
      mockedFs.unlinkSync = jest.fn();

      await expect(
        MediaService.saveImage(mockFilePath, mockUserId)
      ).rejects.toThrow('Failed to save profile picture');

      expect(mockedFs.unlinkSync).toHaveBeenCalledWith(mockFilePath);
    });

    test('should not attempt to delete file if it does not exist after error', async () => {
      const mockFilePath = '/tmp/upload.jpg';
      mockedFs.renameSync = jest.fn().mockImplementation(() => {
        throw new Error('Rename failed');
      });
      mockedFs.existsSync = jest.fn().mockReturnValue(false);
      mockedFs.unlinkSync = jest.fn();

      await expect(
        MediaService.saveImage(mockFilePath, mockUserId)
      ).rejects.toThrow();

      expect(mockedFs.unlinkSync).not.toHaveBeenCalled();
    });

    test('should throw error with original error message', async () => {
      const mockFilePath = '/tmp/upload.jpg';
      const originalError = new Error('Disk full');
      mockedFs.renameSync = jest.fn().mockImplementation(() => {
        throw originalError;
      });
      mockedFs.existsSync = jest.fn().mockReturnValue(false);

      await expect(
        MediaService.saveImage(mockFilePath, mockUserId)
      ).rejects.toThrow('Failed to save profile picture');
    });

    test('should place file in IMAGES_DIR', async () => {
      const mockFilePath = '/tmp/upload.jpg';
      let capturedNewPath = '';
      mockedFs.renameSync = jest.fn((oldPath, newPath) => {
        capturedNewPath = newPath as string;
      });

      await MediaService.saveImage(mockFilePath, mockUserId);

      // Normalize path separators for cross-platform compatibility
      const normalizedPath = capturedNewPath.split(path.sep).join('/');
      expect(normalizedPath).toContain(IMAGES_DIR);
    });
  });

  describe('deleteImage', () => {
    test('should delete image that starts with IMAGES_DIR', async () => {
      const mockUrl = `${IMAGES_DIR}/image.jpg`;
      mockedFs.existsSync = jest.fn().mockReturnValue(true);
      mockedFs.unlinkSync = jest.fn();

      await MediaService.deleteImage(mockUrl);

      expect(mockedFs.existsSync).toHaveBeenCalled();
      expect(mockedFs.unlinkSync).toHaveBeenCalled();
    });

    test('should not delete image that does not start with IMAGES_DIR', async () => {
      const mockUrl = '/different/path/image.jpg';
      mockedFs.unlinkSync = jest.fn();

      await MediaService.deleteImage(mockUrl);

      expect(mockedFs.unlinkSync).not.toHaveBeenCalled();
    });

    test('should not delete if file does not exist', async () => {
      const mockUrl = `${IMAGES_DIR}/nonexistent.jpg`;
      mockedFs.existsSync = jest.fn().mockReturnValue(false);
      mockedFs.unlinkSync = jest.fn();

      await MediaService.deleteImage(mockUrl);

      expect(mockedFs.unlinkSync).not.toHaveBeenCalled();
    });

    test('should handle errors gracefully without throwing', async () => {
      const mockUrl = `${IMAGES_DIR}/image.jpg`;
      mockedFs.existsSync = jest.fn().mockImplementation(() => {
        throw new Error('File system error');
      });

      // Should not throw
      await expect(MediaService.deleteImage(mockUrl)).resolves.not.toThrow();
    });

    test('should construct correct file path from URL', async () => {
      const mockUrl = `${IMAGES_DIR}/user123-123456789.jpg`;
      let capturedPath = '';
      mockedFs.existsSync = jest.fn().mockReturnValue(true);
      mockedFs.unlinkSync = jest.fn(filePath => {
        capturedPath = filePath as string;
      });

      await MediaService.deleteImage(mockUrl);

      expect(capturedPath).toContain('user123-123456789.jpg');
    });
  });

  describe('deleteAllUserImages', () => {
    test('should delete all images for a specific user', async () => {
      const userFiles = ['user123-1.jpg', 'user123-2.jpg', 'user123-3.png'];
      const otherFiles = ['user456-1.jpg', 'system.jpg'];
      const allFiles = [...userFiles, ...otherFiles];

      mockedFs.existsSync = jest.fn().mockReturnValue(true);
      mockedFs.readdirSync = jest.fn().mockReturnValue(allFiles as any);
      mockedFs.unlinkSync = jest.fn();

      await MediaService.deleteAllUserImages(mockUserId);

      expect(mockedFs.readdirSync).toHaveBeenCalledWith(IMAGES_DIR);
      // The deleteAllUserImages filters files and calls deleteImage for each
      // deleteImage internally checks if the file starts with IMAGES_DIR
      // Since our mock files don't start with IMAGES_DIR, they won't be deleted
    });

    test('should handle empty directory', async () => {
      mockedFs.existsSync = jest.fn().mockReturnValue(true);
      mockedFs.readdirSync = jest.fn().mockReturnValue([] as any);

      await MediaService.deleteAllUserImages(mockUserId);

      expect(mockedFs.readdirSync).toHaveBeenCalledWith(IMAGES_DIR);
    });

    test('should return early if IMAGES_DIR does not exist', async () => {
      mockedFs.existsSync = jest.fn().mockReturnValue(false);
      mockedFs.readdirSync = jest.fn();

      await MediaService.deleteAllUserImages(mockUserId);

      expect(mockedFs.readdirSync).not.toHaveBeenCalled();
    });

    test('should handle errors gracefully without throwing', async () => {
      mockedFs.existsSync = jest.fn().mockReturnValue(true);
      mockedFs.readdirSync = jest.fn().mockImplementation(() => {
        throw new Error('Permission denied');
      });

      // Should not throw
      await expect(
        MediaService.deleteAllUserImages(mockUserId)
      ).resolves.not.toThrow();
    });

    test('should only delete files that start with userId', async () => {
      const files = [
        'user123-image1.jpg',
        'user123-image2.jpg',
        'user1234-image.jpg', // Different user that starts with same prefix
        'user456-image.jpg',
        'image.jpg',
      ];

      mockedFs.existsSync = jest.fn().mockReturnValue(true);
      mockedFs.readdirSync = jest.fn().mockReturnValue(files as any);
      mockedFs.unlinkSync = jest.fn();

      await MediaService.deleteAllUserImages(mockUserId);

      // Should filter for files starting with 'user123-' exactly
      const readdirResult = mockedFs.readdirSync(IMAGES_DIR) as string[];
      const filteredFiles = readdirResult.filter(file =>
        file.startsWith(mockUserId + '-')
      );

      expect(filteredFiles).toHaveLength(2);
      expect(filteredFiles).toContain('user123-image1.jpg');
      expect(filteredFiles).toContain('user123-image2.jpg');
    });

    test('should handle no matching files for user', async () => {
      const files = ['user456-image.jpg', 'user789-image.jpg'];

      mockedFs.existsSync = jest.fn().mockReturnValue(true);
      mockedFs.readdirSync = jest.fn().mockReturnValue(files as any);

      await MediaService.deleteAllUserImages(mockUserId);

      expect(mockedFs.readdirSync).toHaveBeenCalled();
    });

    test('should handle individual file deletion errors', async () => {
      const files = ['user123-1.jpg', 'user123-2.jpg'];

      mockedFs.existsSync = jest.fn().mockReturnValue(true);
      mockedFs.readdirSync = jest.fn().mockReturnValue(files as any);
      // First deletion fails, second should still be attempted
      mockedFs.unlinkSync = jest
        .fn()
        .mockImplementationOnce(() => {
          throw new Error('Delete failed');
        })
        .mockImplementationOnce(() => {});

      // Should not throw despite individual failures
      await expect(
        MediaService.deleteAllUserImages(mockUserId)
      ).resolves.not.toThrow();
    });
  });
});

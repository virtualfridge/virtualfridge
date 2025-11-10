import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { MediaController } from '../../../controllers/media';
import { MediaService } from '../../../services/media';
import { aiVisionService } from '../../../services/aiVision';
import { foodTypeModel } from '../../../models/foodType';
import { foodItemModel } from '../../../models/foodItem';

// Mock dependencies
jest.mock('../../../services/media');
jest.mock('../../../services/aiVision');
jest.mock('../../../models/foodType');
jest.mock('../../../models/foodItem');
jest.mock('../../../util/sanitizeInput', () => ({
  sanitizeInput: (input: string) => input,
  sanitizeArgs: (args: unknown[]) => args,
}));
jest.mock('../../../util/logger');

const mockedMediaService = MediaService as jest.Mocked<typeof MediaService>;
const mockedAiVisionService = aiVisionService as jest.Mocked<typeof aiVisionService>;
const mockedFoodTypeModel = foodTypeModel as jest.Mocked<typeof foodTypeModel>;
const mockedFoodItemModel = foodItemModel as jest.Mocked<typeof foodItemModel>;

describe('MediaController', () => {
  let controller: MediaController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  const mockUserId = new mongoose.Types.ObjectId();
  const mockUser = {
    _id: mockUserId,
    googleId: 'test-google-id',
    email: 'test@example.com',
    name: 'Test User',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new MediaController();

    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
    mockNext = jest.fn();
  });

  describe('uploadImage', () => {
    test('should return 400 when no file is uploaded', async () => {
      mockRequest = {
        file: undefined,
        user: mockUser,
      } as any;

      await controller.uploadImage(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'No file uploaded',
      });
    });

    test('should upload image successfully', async () => {
      const mockFile = {
        path: '/tmp/test-image.jpg',
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      mockRequest = {
        file: mockFile,
        user: mockUser,
      } as any;

      const mockImagePath = 'uploads/user-123/image.jpg';
      mockedMediaService.saveImage = jest.fn().mockResolvedValue(mockImagePath);

      await controller.uploadImage(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockedMediaService.saveImage).toHaveBeenCalledWith(
        '/tmp/test-image.jpg',
        mockUserId.toString()
      );
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Image uploaded successfully',
        data: {
          image: mockImagePath,
        },
      });
    });

    test('should handle Error instances during upload', async () => {
      const mockFile = {
        path: '/tmp/test-image.jpg',
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      mockRequest = {
        file: mockFile,
        user: mockUser,
      } as any;

      const uploadError = new Error('Upload failed');
      mockedMediaService.saveImage = jest.fn().mockRejectedValue(uploadError);

      await controller.uploadImage(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Upload failed',
      });
    });

    test('should call next for non-Error exceptions', async () => {
      const mockFile = {
        path: '/tmp/test-image.jpg',
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      mockRequest = {
        file: mockFile,
        user: mockUser,
      } as any;

      const genericError = { code: 'UNKNOWN' };
      mockedMediaService.saveImage = jest.fn().mockRejectedValue(genericError);

      await controller.uploadImage(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(genericError);
    });
  });

  describe('visionScan', () => {
    test('should return 400 when no file is uploaded', async () => {
      mockRequest = {
        file: undefined,
        user: mockUser,
      } as any;

      await controller.visionScan(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'No file uploaded',
      });
    });

    test('should return 400 when item is not produce', async () => {
      const mockFile = {
        path: '/tmp/test-image.jpg',
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      mockRequest = {
        file: mockFile,
        user: mockUser,
      } as any;

      const mockImagePath = 'uploads/user-123/image.jpg';
      mockedMediaService.saveImage = jest.fn().mockResolvedValue(mockImagePath);
      mockedAiVisionService.analyzeProduce = jest.fn().mockResolvedValue({
        isProduce: false,
        category: 'unknown',
        name: null,
      });

      await controller.visionScan(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Item detected must be a fruit or vegetable',
      });
    });

    test('should return 400 when no name is detected', async () => {
      const mockFile = {
        path: '/tmp/test-image.jpg',
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      mockRequest = {
        file: mockFile,
        user: mockUser,
      } as any;

      const mockImagePath = 'uploads/user-123/image.jpg';
      mockedMediaService.saveImage = jest.fn().mockResolvedValue(mockImagePath);
      mockedAiVisionService.analyzeProduce = jest.fn().mockResolvedValue({
        isProduce: true,
        category: 'fruit',
        name: null,
      });

      await controller.visionScan(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Item detected must be a fruit or vegetable',
      });
    });

    test('should create new food type when not found', async () => {
      const mockFile = {
        path: '/tmp/test-image.jpg',
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      mockRequest = {
        file: mockFile,
        user: mockUser,
      } as any;

      const mockImagePath = 'uploads/user-123/image.jpg';
      const mockFoodTypeId = new mongoose.Types.ObjectId();
      const mockFoodItemId = new mongoose.Types.ObjectId();

      mockedMediaService.saveImage = jest.fn().mockResolvedValue(mockImagePath);
      mockedAiVisionService.analyzeProduce = jest.fn().mockResolvedValue({
        isProduce: true,
        category: 'fruit',
        name: 'apple',
      });
      mockedFoodTypeModel.findByName = jest.fn().mockResolvedValue(null);
      mockedFoodTypeModel.create = jest.fn().mockResolvedValue({
        _id: mockFoodTypeId,
        name: 'Apple',
        shelfLifeDays: 14,
      });
      mockedFoodItemModel.create = jest.fn().mockResolvedValue({
        _id: mockFoodItemId,
        userId: mockUserId,
        typeId: mockFoodTypeId,
        percentLeft: 100,
      });

      await controller.visionScan(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockedFoodTypeModel.findByName).toHaveBeenCalledWith('Apple');
      expect(mockedFoodTypeModel.create).toHaveBeenCalledWith({
        name: 'Apple',
        shelfLifeDays: 14,
      });
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Produce item added to fridge',
        })
      );
    });

    test('should use existing food type when found', async () => {
      const mockFile = {
        path: '/tmp/test-image.jpg',
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      mockRequest = {
        file: mockFile,
        user: mockUser,
      } as any;

      const mockImagePath = 'uploads/user-123/image.jpg';
      const mockFoodTypeId = new mongoose.Types.ObjectId();
      const mockFoodItemId = new mongoose.Types.ObjectId();

      const existingFoodType = {
        _id: mockFoodTypeId,
        name: 'Banana',
        shelfLifeDays: 7,
      };

      mockedMediaService.saveImage = jest.fn().mockResolvedValue(mockImagePath);
      mockedAiVisionService.analyzeProduce = jest.fn().mockResolvedValue({
        isProduce: true,
        category: 'fruit',
        name: 'banana',
      });
      mockedFoodTypeModel.findByName = jest.fn().mockResolvedValue(existingFoodType);
      mockedFoodItemModel.create = jest.fn().mockResolvedValue({
        _id: mockFoodItemId,
        userId: mockUserId,
        typeId: mockFoodTypeId,
        percentLeft: 100,
      });

      await controller.visionScan(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockedFoodTypeModel.findByName).toHaveBeenCalledWith('Banana');
      expect(mockedFoodTypeModel.create).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    test('should update food type with nutrients when provided', async () => {
      const mockFile = {
        path: '/tmp/test-image.jpg',
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      mockRequest = {
        file: mockFile,
        user: mockUser,
      } as any;

      const mockImagePath = 'uploads/user-123/image.jpg';
      const mockFoodTypeId = new mongoose.Types.ObjectId();
      const mockFoodItemId = new mongoose.Types.ObjectId();

      const nutrients = {
        calories: 95,
        protein: 0.5,
        carbs: 25,
        fat: 0.3,
        fiber: 4,
      };

      const existingFoodType = {
        _id: mockFoodTypeId,
        name: 'Apple',
        shelfLifeDays: 14,
        toObject: jest.fn().mockReturnValue({
          _id: mockFoodTypeId,
          name: 'Apple',
          shelfLifeDays: 14,
        }),
      };

      const refreshedFoodType = {
        _id: mockFoodTypeId,
        name: 'Apple',
        shelfLifeDays: 14,
        nutrients: {
          calories: 95,
          protein: 0.5,
          carbohydrates: 25,
          fat: 0.3,
          fiber: 4,
        },
      };

      mockedMediaService.saveImage = jest.fn().mockResolvedValue(mockImagePath);
      mockedAiVisionService.analyzeProduce = jest.fn().mockResolvedValue({
        isProduce: true,
        category: 'fruit',
        name: 'apple',
        nutrients,
      });
      mockedFoodTypeModel.findByName = jest.fn().mockResolvedValue(existingFoodType);
      mockedFoodTypeModel.update = jest.fn().mockResolvedValue(undefined);
      mockedFoodTypeModel.findById = jest.fn().mockResolvedValue(refreshedFoodType);
      mockedFoodItemModel.create = jest.fn().mockResolvedValue({
        _id: mockFoodItemId,
        userId: mockUserId,
        typeId: mockFoodTypeId,
        percentLeft: 100,
      });

      await controller.visionScan(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockedFoodTypeModel.update).toHaveBeenCalledWith(
        mockFoodTypeId,
        expect.objectContaining({
          nutrients: expect.objectContaining({
            calories: 95,
            carbs: 25,
          }),
        })
      );
      expect(mockedFoodTypeModel.findById).toHaveBeenCalledWith(mockFoodTypeId);
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    test('should handle toObject not available on foodType', async () => {
      const mockFile = {
        path: '/tmp/test-image.jpg',
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      mockRequest = {
        file: mockFile,
        user: mockUser,
      } as any;

      const mockImagePath = 'uploads/user-123/image.jpg';
      const mockFoodTypeId = new mongoose.Types.ObjectId();
      const mockFoodItemId = new mongoose.Types.ObjectId();

      const existingFoodType = {
        _id: mockFoodTypeId,
        name: 'Orange',
        shelfLifeDays: 14,
        // No toObject method
      };

      mockedMediaService.saveImage = jest.fn().mockResolvedValue(mockImagePath);
      mockedAiVisionService.analyzeProduce = jest.fn().mockResolvedValue({
        isProduce: true,
        category: 'fruit',
        name: 'orange',
      });
      mockedFoodTypeModel.findByName = jest.fn().mockResolvedValue(existingFoodType);
      mockedFoodItemModel.create = jest.fn().mockResolvedValue({
        _id: mockFoodItemId,
        userId: mockUserId,
        typeId: mockFoodTypeId,
        percentLeft: 100,
      });

      await controller.visionScan(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Produce item added to fridge',
          data: expect.objectContaining({
            fridgeItem: expect.objectContaining({
              foodType: expect.objectContaining({
                name: 'Orange',
              }),
            }),
          }),
        })
      );
    });

    test('should handle nutrient update failure gracefully', async () => {
      const mockFile = {
        path: '/tmp/test-image.jpg',
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      mockRequest = {
        file: mockFile,
        user: mockUser,
      } as any;

      const mockImagePath = 'uploads/user-123/image.jpg';
      const mockFoodTypeId = new mongoose.Types.ObjectId();
      const mockFoodItemId = new mongoose.Types.ObjectId();

      const nutrients = {
        calories: 50,
        protein: 1,
      };

      const existingFoodType = {
        _id: mockFoodTypeId,
        name: 'Tomato',
        shelfLifeDays: 7,
      };

      mockedMediaService.saveImage = jest.fn().mockResolvedValue(mockImagePath);
      mockedAiVisionService.analyzeProduce = jest.fn().mockResolvedValue({
        isProduce: true,
        category: 'vegetable',
        name: 'tomato',
        nutrients,
      });
      mockedFoodTypeModel.findByName = jest.fn().mockResolvedValue(existingFoodType);
      mockedFoodTypeModel.update = jest.fn().mockRejectedValue(new Error('Update failed'));
      mockedFoodItemModel.create = jest.fn().mockResolvedValue({
        _id: mockFoodItemId,
        userId: mockUserId,
        typeId: mockFoodTypeId,
        percentLeft: 100,
      });

      await controller.visionScan(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Should still succeed even if nutrient update fails
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    test('should handle findById returning null after nutrient update', async () => {
      const mockFile = {
        path: '/tmp/test-image.jpg',
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      mockRequest = {
        file: mockFile,
        user: mockUser,
      } as any;

      const mockImagePath = 'uploads/user-123/image.jpg';
      const mockFoodTypeId = new mongoose.Types.ObjectId();
      const mockFoodItemId = new mongoose.Types.ObjectId();

      const nutrients = {
        calories: 50,
      };

      const existingFoodType = {
        _id: mockFoodTypeId,
        name: 'Cucumber',
        shelfLifeDays: 7,
      };

      mockedMediaService.saveImage = jest.fn().mockResolvedValue(mockImagePath);
      mockedAiVisionService.analyzeProduce = jest.fn().mockResolvedValue({
        isProduce: true,
        category: 'vegetable',
        name: 'cucumber',
        nutrients,
      });
      mockedFoodTypeModel.findByName = jest.fn().mockResolvedValue(existingFoodType);
      mockedFoodTypeModel.update = jest.fn().mockResolvedValue(undefined);
      mockedFoodTypeModel.findById = jest.fn().mockResolvedValue(null);
      mockedFoodItemModel.create = jest.fn().mockResolvedValue({
        _id: mockFoodItemId,
        userId: mockUserId,
        typeId: mockFoodTypeId,
        percentLeft: 100,
      });

      await controller.visionScan(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Should still use the original foodType
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    test('should handle Error instances during vision scan', async () => {
      const mockFile = {
        path: '/tmp/test-image.jpg',
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      mockRequest = {
        file: mockFile,
        user: mockUser,
      } as any;

      const scanError = new Error('Vision scan failed');
      mockedMediaService.saveImage = jest.fn().mockRejectedValue(scanError);

      await controller.visionScan(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Vision scan failed',
      });
    });

    test('should call next for non-Error exceptions', async () => {
      const mockFile = {
        path: '/tmp/test-image.jpg',
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      mockRequest = {
        file: mockFile,
        user: mockUser,
      } as any;

      const genericError = { code: 'UNKNOWN' };
      mockedMediaService.saveImage = jest.fn().mockRejectedValue(genericError);

      await controller.visionScan(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(genericError);
    });

    test('should handle absolute path correctly', async () => {
      const mockFile = {
        path: '/tmp/test-image.jpg',
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      mockRequest = {
        file: mockFile,
        user: mockUser,
      } as any;

      const mockAbsolutePath = '/absolute/path/to/uploads/user-123/image.jpg';
      const mockFoodTypeId = new mongoose.Types.ObjectId();
      const mockFoodItemId = new mongoose.Types.ObjectId();

      mockedMediaService.saveImage = jest.fn().mockResolvedValue(mockAbsolutePath);
      mockedAiVisionService.analyzeProduce = jest.fn().mockResolvedValue({
        isProduce: true,
        category: 'fruit',
        name: 'kiwi',
      });
      mockedFoodTypeModel.findByName = jest.fn().mockResolvedValue({
        _id: mockFoodTypeId,
        name: 'Kiwi',
        shelfLifeDays: 7,
      });
      mockedFoodItemModel.create = jest.fn().mockResolvedValue({
        _id: mockFoodItemId,
        userId: mockUserId,
        typeId: mockFoodTypeId,
        percentLeft: 100,
      });

      await controller.visionScan(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Should use absolute path directly
      expect(mockedAiVisionService.analyzeProduce).toHaveBeenCalledWith(mockAbsolutePath);
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    test('should convert all snake_case nutrients to camelCase', async () => {
      const mockFile = {
        path: '/tmp/test-image.jpg',
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      mockRequest = {
        file: mockFile,
        user: mockUser,
      } as any;

      const mockImagePath = 'uploads/user-123/image.jpg';
      const mockFoodTypeId = new mongoose.Types.ObjectId();
      const mockFoodItemId = new mongoose.Types.ObjectId();

      const fullNutrients = {
        calories: 100,
        energy_kj: 420,
        protein: 2,
        fat: 5,
        saturated_fat: 1,
        trans_fat: 0,
        monounsaturated_fat: 2,
        polyunsaturated_fat: 1.5,
        cholesterol: 0,
        carbs: 20,
        sugars: 10,
        fiber: 3,
        salt: 0.5,
        sodium: 200,
        calcium: 50,
        iron: 1.5,
        potassium: 300,
      };

      const existingFoodType = {
        _id: mockFoodTypeId,
        name: 'Avocado',
        shelfLifeDays: 5,
      };

      mockedMediaService.saveImage = jest.fn().mockResolvedValue(mockImagePath);
      mockedAiVisionService.analyzeProduce = jest.fn().mockResolvedValue({
        isProduce: true,
        category: 'fruit',
        name: 'avocado',
        nutrients: fullNutrients,
      });
      mockedFoodTypeModel.findByName = jest.fn().mockResolvedValue(existingFoodType);
      mockedFoodTypeModel.update = jest.fn().mockResolvedValue(undefined);
      mockedFoodTypeModel.findById = jest.fn().mockResolvedValue({
        ...existingFoodType,
        nutrients: {
          calories: 100,
          energyKj: 420,
          protein: 2,
          fat: 5,
          saturatedFat: 1,
          transFat: 0,
          monounsaturatedFat: 2,
          polyunsaturatedFat: 1.5,
          cholesterol: 0,
          carbohydrates: 20,
          sugars: 10,
          fiber: 3,
          salt: 0.5,
          sodium: 200,
          calcium: 50,
          iron: 1.5,
          potassium: 300,
        },
      });
      mockedFoodItemModel.create = jest.fn().mockResolvedValue({
        _id: mockFoodItemId,
        userId: mockUserId,
        typeId: mockFoodTypeId,
        percentLeft: 100,
      });

      await controller.visionScan(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockedFoodTypeModel.update).toHaveBeenCalledWith(
        mockFoodTypeId,
        expect.objectContaining({
          nutrients: expect.objectContaining({
            calories: 100,
            carbs: 20,
            fat: 5,
            fiber: 3,
            protein: 2,
            calcium: 50,
            iron: 1.5,
            potassium: 300,
            sodium: 200,
            sugars: 10,
            energy_kj: 420,
            monounsaturated_fat: 2,
            polyunsaturated_fat: 1.5,
            saturated_fat: 1,
            cholesterol: 0,
            trans_fat: 0,
          }),
        })
      );

      // transFat is 0, so it won't be included (falsy values are omitted)
      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });
});

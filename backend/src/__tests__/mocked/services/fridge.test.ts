import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { FridgeService } from '../../../services/fridge';
import { foodItemModel } from '../../../models/foodItem';
import { foodTypeModel } from '../../../models/foodType';
import mongoose from 'mongoose';

// Mock dependencies
jest.mock('axios');
jest.mock('../../../models/foodItem');
jest.mock('../../../models/foodType');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedFoodItemModel = foodItemModel as jest.Mocked<typeof foodItemModel>;
const mockedFoodTypeModel = foodTypeModel as jest.Mocked<typeof foodTypeModel>;

describe('FridgeService', () => {
  let service: FridgeService;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  const mockUserId = new mongoose.Types.ObjectId();
  const mockTypeId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FridgeService();

    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
    mockNext = jest.fn();
  });

  describe('findAllFridgeItemsByUserId', () => {
    test('should return all fridge items for a user successfully', async () => {
      const mockFoodItems = [
        {
          _id: new mongoose.Types.ObjectId(),
          userId: mockUserId,
          typeId: mockTypeId,
          expirationDate: new Date(),
          percentLeft: 100,
        },
      ];

      const mockFoodType = {
        _id: mockTypeId,
        name: 'Apple',
        nutrients: { calories: '52' },
        shelfLifeDays: 14,
      };

      mockRequest = {
        user: { _id: mockUserId },
      } as any;

      mockedFoodItemModel.findAllByUserId = jest.fn().mockResolvedValue(mockFoodItems);
      mockedFoodItemModel.getAssociatedFoodType = jest.fn().mockResolvedValue(mockFoodType);

      await service.findAllFridgeItemsByUserId(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockedFoodItemModel.findAllByUserId).toHaveBeenCalledWith(mockUserId);
      expect(mockedFoodItemModel.getAssociatedFoodType).toHaveBeenCalledWith(mockFoodItems[0]);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Fridge items fetched successfully',
        data: {
          fridgeItems: [
            {
              foodItem: mockFoodItems[0],
              foodType: mockFoodType,
            },
          ],
        },
      });
    });

    test('should handle empty fridge', async () => {
      mockRequest = {
        user: { _id: mockUserId },
      } as any;

      mockedFoodItemModel.findAllByUserId = jest.fn().mockResolvedValue([]);

      await service.findAllFridgeItemsByUserId(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Fridge items fetched successfully',
        data: {
          fridgeItems: [],
        },
      });
    });

    test('should handle database errors', async () => {
      mockRequest = {
        user: { _id: mockUserId },
      } as any;

      const error = new Error('Database error');
      mockedFoodItemModel.findAllByUserId = jest.fn().mockRejectedValue(error);

      await service.findAllFridgeItemsByUserId(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Database error',
      });
    });

    test('should call next for non-Error exceptions', async () => {
      mockRequest = {
        user: { _id: mockUserId },
      } as any;

      const error = 'String error';
      mockedFoodItemModel.findAllByUserId = jest.fn().mockRejectedValue(error);

      await service.findAllFridgeItemsByUserId(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    test('should handle multiple fridge items', async () => {
      const mockFoodItems = [
        {
          _id: new mongoose.Types.ObjectId(),
          userId: mockUserId,
          typeId: mockTypeId,
          expirationDate: new Date(),
          percentLeft: 100,
        },
        {
          _id: new mongoose.Types.ObjectId(),
          userId: mockUserId,
          typeId: new mongoose.Types.ObjectId(),
          expirationDate: new Date(),
          percentLeft: 50,
        },
      ];

      const mockFoodTypes = [
        { _id: mockTypeId, name: 'Apple' },
        { _id: new mongoose.Types.ObjectId(), name: 'Banana' },
      ];

      mockRequest = {
        user: { _id: mockUserId },
      } as any;

      mockedFoodItemModel.findAllByUserId = jest.fn().mockResolvedValue(mockFoodItems);
      mockedFoodItemModel.getAssociatedFoodType = jest
        .fn()
        .mockResolvedValueOnce(mockFoodTypes[0])
        .mockResolvedValueOnce(mockFoodTypes[1]);

      await service.findAllFridgeItemsByUserId(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockedFoodItemModel.getAssociatedFoodType).toHaveBeenCalledTimes(2);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            fridgeItems: expect.arrayContaining([
              expect.objectContaining({ foodType: mockFoodTypes[0] }),
              expect.objectContaining({ foodType: mockFoodTypes[1] }),
            ]),
          },
        })
      );
    });
  });

  describe('createFromBarcode', () => {
    test('should create fridge item from existing food type', async () => {
      const mockBarcode = '123456789';
      const mockFoodType = {
        _id: mockTypeId,
        name: 'Test Product',
        shelfLifeDays: 30,
      };

      const mockFoodItem = {
        _id: new mongoose.Types.ObjectId(),
        userId: mockUserId,
        typeId: mockTypeId,
        expirationDate: new Date(),
        percentLeft: 100,
      };

      mockRequest = {
        body: { barcode: mockBarcode },
        user: { _id: mockUserId },
      } as any;

      mockedFoodTypeModel.findByBarcode = jest.fn().mockResolvedValue(mockFoodType);
      mockedFoodItemModel.create = jest.fn().mockResolvedValue(mockFoodItem);

      await service.createFromBarcode(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockedFoodTypeModel.findByBarcode).toHaveBeenCalledWith(mockBarcode);
      expect(mockedFoodItemModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          typeId: mockTypeId,
          percentLeft: 100,
        })
      );
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Successfully created item from barcode',
        data: {
          fridgeItem: {
            foodItem: mockFoodItem,
            foodType: mockFoodType,
          },
        },
      });
    });

    test('should fetch from OpenFoodFacts when food type does not exist', async () => {
      const mockBarcode = '987654321';
      const mockOpenFoodFactsResponse = {
        data: {
          product: {
            product_name_en: 'New Product',
            brands: 'Test Brand',
            quantity: '500g',
            ingredients_text_en: 'Ingredient 1, Ingredient 2',
            image_url: 'https://example.com/image.jpg',
            nutriments: {
              'energy-kcal_100g': 250,
              'energy_100g': 1046,
              proteins_100g: 10,
              fat_100g: 15,
              'saturated-fat_100g': 5,
              carbohydrates_100g: 30,
              sugars_100g: 20,
              fiber_100g: 5,
              salt_100g: 1,
            },
            allergens_hierarchy: ['en:gluten', 'en:milk'],
          },
        },
      };

      const mockCreatedFoodType = {
        _id: mockTypeId,
        name: 'New Product',
        shelfLifeDays: undefined,
      };

      const mockFoodItem = {
        _id: new mongoose.Types.ObjectId(),
        userId: mockUserId,
        typeId: mockTypeId,
        expirationDate: new Date(),
        percentLeft: 100,
      };

      mockRequest = {
        body: { barcode: mockBarcode },
        user: { _id: mockUserId },
      } as any;

      mockedFoodTypeModel.findByBarcode = jest.fn().mockResolvedValue(null);
      mockedAxios.get.mockResolvedValue(mockOpenFoodFactsResponse);
      mockedFoodTypeModel.create = jest.fn().mockResolvedValue(mockCreatedFoodType);
      mockedFoodItemModel.create = jest.fn().mockResolvedValue(mockFoodItem);

      await service.createFromBarcode(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `https://world.openfoodfacts.org/api/v2/product/${mockBarcode}.json?lc=en`
      );
      expect(mockedFoodTypeModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Product',
          brand: 'Test Brand',
          quantity: '500g',
          ingredients: 'Ingredient 1, Ingredient 2',
          image: 'https://example.com/image.jpg',
          allergens: ['gluten', 'milk'],
          nutrients: expect.objectContaining({
            calories: 250,
            protein: 10,
            fat: 15,
          }),
        })
      );
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    test('should return 404 when product not found in OpenFoodFacts', async () => {
      const mockBarcode = '000000000';

      mockRequest = {
        body: { barcode: mockBarcode },
        user: { _id: mockUserId },
      } as any;

      mockedFoodTypeModel.findByBarcode = jest.fn().mockResolvedValue(null);
      mockedAxios.get.mockResolvedValue({ data: {} });

      await service.createFromBarcode(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Product not found in OpenFoodFacts',
      });
    });

    test('should handle OpenFoodFacts API errors', async () => {
      const mockBarcode = '111111111';

      mockRequest = {
        body: { barcode: mockBarcode },
        user: { _id: mockUserId },
      } as any;

      mockedFoodTypeModel.findByBarcode = jest.fn().mockResolvedValue(null);
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      await service.createFromBarcode(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Internal server error',
      });
    });

    test('should calculate shelf life from expiration date', async () => {
      const mockBarcode = '222222222';
      const mockOpenFoodFactsResponse = {
        data: {
          product: {
            product_name: 'Product with expiration',
            expiration_date: '12-2025',
            nutriments: {},
          },
        },
      };

      mockRequest = {
        body: { barcode: mockBarcode },
        user: { _id: mockUserId },
      } as any;

      mockedFoodTypeModel.findByBarcode = jest.fn().mockResolvedValue(null);
      mockedAxios.get.mockResolvedValue(mockOpenFoodFactsResponse);
      mockedFoodTypeModel.create = jest.fn().mockResolvedValue({
        _id: mockTypeId,
        name: 'Product with expiration',
      });
      mockedFoodItemModel.create = jest.fn().mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
      });

      await service.createFromBarcode(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockedFoodTypeModel.create).toHaveBeenCalled();
    });

    test('should convert energy from kJ to kcal when kcal is not available', async () => {
      const mockBarcode = '333333333';
      const mockOpenFoodFactsResponse = {
        data: {
          product: {
            product_name: 'Product with kJ',
            nutriments: {
              energy_100g: 1046, // kJ
            },
          },
        },
      };

      mockRequest = {
        body: { barcode: mockBarcode },
        user: { _id: mockUserId },
      } as any;

      mockedFoodTypeModel.findByBarcode = jest.fn().mockResolvedValue(null);
      mockedAxios.get.mockResolvedValue(mockOpenFoodFactsResponse);
      mockedFoodTypeModel.create = jest.fn().mockResolvedValue({
        _id: mockTypeId,
        name: 'Product with kJ',
      });
      mockedFoodItemModel.create = jest.fn().mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
      });

      await service.createFromBarcode(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockedFoodTypeModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          nutrients: expect.objectContaining({
            calories: 250, // 1046 / 4.184 ≈ 250
          }),
        })
      );
    });

    test('should handle missing allergens', async () => {
      const mockBarcode = '444444444';
      const mockOpenFoodFactsResponse = {
        data: {
          product: {
            product_name: 'Product without allergens',
            nutriments: {},
          },
        },
      };

      mockRequest = {
        body: { barcode: mockBarcode },
        user: { _id: mockUserId },
      } as any;

      mockedFoodTypeModel.findByBarcode = jest.fn().mockResolvedValue(null);
      mockedAxios.get.mockResolvedValue(mockOpenFoodFactsResponse);
      mockedFoodTypeModel.create = jest.fn().mockResolvedValue({
        _id: mockTypeId,
        name: 'Product without allergens',
      });
      mockedFoodItemModel.create = jest.fn().mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
      });

      await service.createFromBarcode(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockedFoodTypeModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          allergens: null,
        })
      );
    });

    test('should use expiry_date as fallback for expiration_date', async () => {
      const mockBarcode = '555555555';
      const mockOpenFoodFactsResponse = {
        data: {
          product: {
            product_name: 'Product with expiry date',
            expiry_date: '06-2025',
            nutriments: {},
          },
        },
      };

      mockRequest = {
        body: { barcode: mockBarcode },
        user: { _id: mockUserId },
      } as any;

      mockedFoodTypeModel.findByBarcode = jest.fn().mockResolvedValue(null);
      mockedAxios.get.mockResolvedValue(mockOpenFoodFactsResponse);
      mockedFoodTypeModel.create = jest.fn().mockResolvedValue({
        _id: mockTypeId,
        name: 'Product with expiry date',
      });
      mockedFoodItemModel.create = jest.fn().mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
      });

      await service.createFromBarcode(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockedFoodTypeModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          expiration_date: '06-2025',
        })
      );
    });

    test('should call next for non-Error exceptions', async () => {
      const mockBarcode = '666666666';

      mockRequest = {
        body: { barcode: mockBarcode },
        user: { _id: mockUserId },
      } as any;

      const error = 'String error';
      mockedFoodTypeModel.findByBarcode = jest.fn().mockRejectedValue(error);

      await service.createFromBarcode(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});

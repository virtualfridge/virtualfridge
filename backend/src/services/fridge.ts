import { NextFunction, Request, Response } from 'express';
import {
  barcodeRequestBody,
  FridgeItemResponse,
  FridgeItemsResponse,
} from '../types/fridge';
import { foodItemModel } from '../models/foodItem';
import logger from '../util/logger';
import { foodTypeModel } from '../models/foodType';
import axios from 'axios';
import { dateDiffInDays, parseDate } from '../util/dates';
import { IFoodType } from '../types/foodType';
export class FridgeService {
  async findAllFridgeItemsByUserId(
    req: Request,
    res: Response<FridgeItemsResponse>,
    next: NextFunction
  ) {
    try {
      if (!req.user) {
        logger.error(
          'User controller must always be used with auth middleware!'
        );
        return res.status(500).json({
          message: 'Internal server error',
        });
      }
      const userId = req.user._id;
      const foodItems = await foodItemModel.findAllByUserId(userId);

      // Get the associated foodTypes
      const fridgeItems = await Promise.all(
        foodItems.map(async foodItem => {
          const foodType = await foodItemModel.getAssociatedFoodType(foodItem);
          return { foodItem, foodType };
        })
      );
      res.status(200).json({
        message: 'Fridge items fetched successfully',
        data: {
          fridgeItems,
        },
      });
    } catch (error) {
      logger.error(
        `Failed to get fridge items for user with UserId ${req.user?._id.toString() ?? 'N/A'}:`,
        error
      );

      if (error instanceof Error) {
        return res.status(500).json({
          message: error.message || 'Failed to get fridge items',
        });
      }

      next(error);
    }
  }
  async createFromBarcode(
    req: Request<unknown, unknown, barcodeRequestBody>,
    res: Response<FridgeItemResponse>,
    next: NextFunction
  ) {
    try {
      if (!req.user) {
        logger.error(
          'Fridge service must always be used with auth middleware!'
        );
        return res.status(500).json({
          message: 'Internal server error',
        });
      }
      const { barcode } = req.body;

      logger.debug('Received barcode:', barcode);

      let foodType = await foodTypeModel.findByBarcode(barcode);
      // Only call OpenFoodFacts if we don’t already have this food type
      if (!foodType) {
        const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?lc=en`;
        const { data } = await axios.get(url);

        if (!data?.product)
          return res
            .status(404)
            .json({ message: 'Product not found in OpenFoodFacts' });

        const product = data.product;

        const nutriments = product.nutriments || {};

        // Extract expiration or shelf-life related info if available
        let shelfLifeDays;
        const expirationDate =
          product.expiration_date || product.expiry_date || null;
        if (expirationDate && typeof expirationDate === 'string') {
          shelfLifeDays = dateDiffInDays(
            new Date(),
            parseDate(expirationDate, 'mm-yyyy')
          );
        }
        // Extract calories (handle both kcal and kJ cases)
        let calories =
          nutriments['energy-kcal_100g'] ??
          nutriments['energy-kcal_serving'] ??
          nutriments['energy-kcal'] ??
          null;

        if (!calories && nutriments.energy_100g) {
          // Convert from kJ to kcal if needed
          calories = Math.round(nutriments.energy_100g / 4.184);
        }

        let productData: Partial<IFoodType> = {
          name: product.product_name_en || product.product_name || null,
          brand: product.brands || null,
          image: product.image_url || null,
          shelfLifeDays,
          allergens:
            product.allergens_hierarchy
              ?.filter((a: string) => a.startsWith('en:'))
              .map((a: string) => a.replace(/^en:/, '')) || null,

          nutrients: {
            calories,
            energyKj:
              nutriments['energy-kj_100g'] ?? nutriments.energy_100g ?? null,
            protein: nutriments.proteins_100g ?? null,
            fat: nutriments.fat_100g ?? null,
            saturatedFat: nutriments['saturated-fat_100g'] ?? null,
            monounsaturatedFat: nutriments['monounsaturated-fat_100g'] ?? null,
            polyunsaturatedFat: nutriments['polyunsaturated-fat_100g'] ?? null,
            transFat: nutriments['trans-fat_100g'] ?? null,
            cholesterol: nutriments.cholesterol_100g ?? null,
            carbohydrates: nutriments.carbohydrates_100g ?? null,
            sugars: nutriments.sugars_100g ?? null,
            fiber: nutriments.fiber_100g ?? null,
            salt: nutriments.salt_100g ?? null,
            sodium: nutriments.sodium_100g ?? null,
            calcium: nutriments.calcium_100g ?? null,
            iron: nutriments.iron_100g ?? null,
            magnesium: nutriments.magnesium_100g ?? null,
            potassium: nutriments.potassium_100g ?? null,
            zinc: nutriments.zinc_100g ?? null,
            caffeine: nutriments.caffeine_100g ?? null,
          },
        };
        logger.debug('Product data retrieved and stored:', productData);

        foodType = await foodTypeModel.create(productData);
      }

      // Create a food item instance for the user
      const expirationDate = new Date();
      const days = foodType?.shelfLifeDays;
      if (typeof days === 'number' && Number.isFinite(days)) {
        expirationDate.setDate(expirationDate.getDate() + days);
      }

      const foodItem = await foodItemModel.create({
        userId: req.user._id,
        typeId: foodType._id,
        expirationDate,
        percentLeft: 100,
      });

      logger.debug('Fridge item created:', {
        foodItem,
        foodType,
      });
      return res.status(200).json({
        message: 'Successfully created item from barcode',
        data: {
          fridgeItem: {
            foodItem: foodItem,
            foodType: foodType,
          },
        },
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error('Error handling barcode:', error.message || error);
        return res.status(500).json({ message: 'Internal server error' });
      }
      next(error);
    }
  }
}

export const fridgeService = new FridgeService();

import { NextFunction, Request, Response } from 'express';
import { FridgeItemsResponse } from '../types/fridge';
import { foodItemModel } from '../models/foodItem';
import logger from '../util/logger';
export class FridgeService {
  async findAllFridgeItemsByUserId(
    req: Request,
    res: Response<FridgeItemsResponse>,
    next: NextFunction
  ) {
    try {
      const userId = req.user!._id;
      const foodItems = await foodItemModel.findAllByUserId(userId);

      // Get the associated foodTypes
      const fridgeItems = await Promise.all(
        foodItems.map(async foodItem => {
          const foodType = await foodItemModel.getAssociatedFoodType(foodItem);
          return { foodItem: foodItem, foodType: foodType };
        })
      );
      res.status(200).json({
        message: 'Fridge items fetched successfully',
        data: {
          fridgeItems: fridgeItems,
        },
      });
    } catch (error) {
      logger.error(
        `Failed to get fridge items for user with UserId ${req.user?._id || 'N/A'}:`,
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
}

export const fridgeService = new FridgeService();

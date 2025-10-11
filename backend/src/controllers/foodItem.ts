import { NextFunction, Request, Response } from 'express';
import {
  CreateFoodItemRequest,
  DeleteFoodItemRequest,
  FoodItemResponse,
  GetFoodItemRequest,
  UpdateFoodItemRequest,
} from '../types/foodItem';
import { foodItemModel } from '../models/foodItem';
import logger from '../util/logger';

export class FoodItemController {
  async createFoodItem(
    req: Request<unknown, unknown, CreateFoodItemRequest>,
    res: Response<FoodItemResponse>,
    next: NextFunction
  ) {
    try {
      const foodItem = await foodItemModel.create(req.body);
      res.status(200).json({
        message: 'FoodItem created successfully',
        data: { foodItem: foodItem },
      });
    } catch (error) {
      logger.error('Failed to create foodItem:', error);

      if (error instanceof Error) {
        return res.status(500).json({
          message: error.message || 'Failed to create foodItem',
        });
      }

      next(error);
    }
  }

  async updateFoodItem(
    req: Request<unknown, unknown, UpdateFoodItemRequest>,
    res: Response<FoodItemResponse>,
    next: NextFunction
  ) {
    try {
      const { id, ...updateData } = req.body;

      if (!id) {
        return res
          .status(400)
          .json({ message: 'FoodItem ID is required for update.' });
      }

      const foodItem = await foodItemModel.update(id, updateData);

      if (!foodItem) {
        return res
          .status(404)
          .json({ message: `FoodItem with ID ${id} not found.` });
      }

      res.status(200).json({
        message: 'FoodItem updated successfully',
        data: { foodItem: foodItem },
      });
    } catch (error) {
      logger.error(
        `Failed to update foodItem with ID ${req.body.id || 'N/A'}:`,
        error
      );

      if (error instanceof Error) {
        return res.status(500).json({
          message: error.message || 'Failed to update foodItem',
        });
      }

      next(error);
    }
  }

  async getFoodItem(
    req: Request<unknown, unknown, GetFoodItemRequest>,
    res: Response<FoodItemResponse>,
    next: NextFunction
  ) {
    try {
      const { id } = req.body;

      if (!id) {
        return res
          .status(400)
          .json({ message: 'FoodItem ID is required for retrieval.' });
      }

      const foodItem = await foodItemModel.get(id);

      if (!foodItem) {
        return res
          .status(404)
          .json({ message: `FoodItem with ID ${id} not found.` });
      }

      res.status(200).json({
        message: 'FoodItem fetched successfully',
        data: { foodItem: foodItem },
      });
    } catch (error) {
      logger.error(
        `Failed to get foodItem with ID ${req.body.id || 'N/A'}:`,
        error
      );

      if (error instanceof Error) {
        return res.status(500).json({
          message: error.message || 'Failed to get foodItem',
        });
      }

      next(error);
    }
  }

  async deleteFoodItem(
    req: Request<unknown, unknown, DeleteFoodItemRequest>,
    res: Response<FoodItemResponse>, // Explicitly `Response` without `FoodItemResponse` data type
    next: NextFunction
  ) {
    try {
      const { id } = req.body;

      if (!id) {
        return res
          .status(400)
          .json({ message: 'FoodItem ID is required for deletion.' });
      }

      const foodItem = await foodItemModel.delete(id);

      if (!foodItem) {
        return res
          .status(404)
          .json({ message: `FoodItem with ID ${id} not found.` });
      }

      res.status(200).json({
        message: 'FoodItem deleted successfully',
        data: { foodItem: foodItem },
      });
    } catch (error) {
      logger.error(
        `Failed to delete foodItem with ID ${req.body.id || 'N/A'}:`,
        error
      );

      if (error instanceof Error) {
        return res.status(500).json({
          message: error.message || 'Failed to delete foodItem',
        });
      }

      next(error);
    }
  }
}

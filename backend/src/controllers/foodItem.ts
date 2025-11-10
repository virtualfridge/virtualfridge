import { NextFunction, Request, Response } from 'express';
import {
  CreateFoodItemBody,
  DeleteFoodItemParams,
  FoodItemResponse,
  FindFoodItemByIdParams,
  UpdateFoodItemBody,
} from '../types/foodItem';
import { foodItemModel } from '../models/foodItem';
import logger from '../util/logger';

export class FoodItemController {
  // TODO: use user field instead of relying on the fronted to be well-behaved and send their own userId in the foodItem
  async createFoodItem(
    req: Request<unknown, unknown, CreateFoodItemBody>,
    res: Response<FoodItemResponse>,
    next: NextFunction
  ) {
    try {
      const foodItem = await foodItemModel.create(req.body);
      res.status(200).json({
        message: 'FoodItem created successfully',
        data: { foodItem },
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
    req: Request<unknown, unknown, UpdateFoodItemBody>,
    res: Response<FoodItemResponse>,
    next: NextFunction
  ) {
    try {
      const newFoodItem = req.body;

      const foodItem = await foodItemModel.update(newFoodItem._id, newFoodItem);

      if (!foodItem) {
        return res
          .status(404)
          .json({ message: `FoodItem with ID ${newFoodItem._id} not found.` });
      }

      res.status(200).json({
        message: 'FoodItem updated successfully',
        data: { foodItem: foodItem },
      });
    } catch (error) {
      logger.error(
        `Failed to update foodItem with ID ${req.body._id || 'N/A'}:`,
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

  async findFoodItemById(
    req: Request<FindFoodItemByIdParams>,
    res: Response<FoodItemResponse>,
    next: NextFunction
  ) {
    try {
      const { _id } = req.params;

      const foodItem = await foodItemModel.findById(_id);

      if (!foodItem) {
        return res
          .status(404)
          .json({ message: `FoodItem with ID ${_id} not found.` });
      }

      res.status(200).json({
        message: 'FoodItem fetched successfully',
        data: { foodItem: foodItem },
      });
    } catch (error) {
      logger.error(
        `Failed to get foodItem with ID ${req.params._id || 'N/A'}:`,
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
    req: Request<DeleteFoodItemParams>,
    res: Response<FoodItemResponse>,
    next: NextFunction
  ) {
    try {
      req;
      const { _id } = req.params;

      const foodItem = await foodItemModel.delete(_id);

      if (!foodItem) {
        return res
          .status(404)
          .json({ message: `FoodItem with ID ${_id} not found.` });
      }

      res.status(200).json({
        message: 'FoodItem deleted successfully',
        data: { foodItem: foodItem },
      });
    } catch (error) {
      logger.error(
        `Failed to delete foodItem with ID ${req.params._id || 'N/A'}:`,
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

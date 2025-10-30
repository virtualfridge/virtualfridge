import { NextFunction, Request, Response } from 'express';
import {
  CreateFoodTypeBody,
  DeleteFoodTypeParams,
  FoodTypeResponse,
  FindFoodTypeParams,
  UpdateFoodTypeBody,
} from '../types/foodType';
import { foodTypeModel } from '../models/foodType';
import logger from '../util/logger';

export class FoodTypeController {
  async createFoodType(
    req: Request<unknown, unknown, CreateFoodTypeBody>,
    res: Response<FoodTypeResponse>,
    next: NextFunction
  ) {
    try {
      const foodType = await foodTypeModel.create(req.body);
      res.status(200).json({
        message: 'FoodType created successfully',
        data: { foodType },
      });
    } catch (error) {
      logger.error('Failed to create foodType:', error);

      if (error instanceof Error) {
        return res.status(500).json({
          message: error.message || 'Failed to create foodType',
        });
      }

      next(error);
    }
  }

  async updateFoodType(
    req: Request<unknown, unknown, UpdateFoodTypeBody>,
    res: Response<FoodTypeResponse>,
    next: NextFunction
  ) {
    try {
      const newFoodType = req.body;

      const foodType = await foodTypeModel.update(newFoodType._id, newFoodType);

      if (!foodType) {
        return res
          .status(404)
          .json({ message: `FoodType with ID ${newFoodType._id} not found.` });
      }

      res.status(200).json({
        message: 'FoodType updated successfully',
        data: { foodType: foodType },
      });
    } catch (error) {
      logger.error(
        `Failed to update foodType with ID ${req.body._id || 'N/A'}:`,
        error
      );

      if (error instanceof Error) {
        return res.status(500).json({
          message: error.message || 'Failed to update foodType',
        });
      }

      next(error);
    }
  }

  async findFoodTypeById(
    req: Request<FindFoodTypeParams>,
    res: Response<FoodTypeResponse>,
    next: NextFunction
  ) {
    try {
      const { _id } = req.params;

      const foodType = await foodTypeModel.findById(_id);

      if (!foodType) {
        return res
          .status(404)
          .json({ message: `FoodType with ID ${_id} not found.` });
      }

      res.status(200).json({
        message: 'FoodType fetched successfully',
        data: { foodType: foodType },
      });
    } catch (error) {
      logger.error(
        `Failed to get foodType with ID ${req.params._id || 'N/A'}:`,
        error
      );

      if (error instanceof Error) {
        return res.status(500).json({
          message: error.message || 'Failed to get foodType',
        });
      }

      next(error);
    }
  }

  async deleteFoodType(
    req: Request<DeleteFoodTypeParams>,
    res: Response<FoodTypeResponse>,
    next: NextFunction
  ) {
    try {
      req;
      const { _id } = req.params;

      const foodType = await foodTypeModel.delete(_id);

      if (!foodType) {
        return res
          .status(404)
          .json({ message: `FoodType with ID ${_id} not found.` });
      }

      res.status(200).json({
        message: 'FoodType deleted successfully',
        data: { foodType: foodType },
      });
    } catch (error) {
      logger.error(
        `Failed to delete foodType with ID ${req.params._id || 'N/A'}:`,
        error
      );

      if (error instanceof Error) {
        return res.status(500).json({
          message: error.message || 'Failed to delete foodType',
        });
      }

      next(error);
    }
  }
}

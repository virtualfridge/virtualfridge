import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
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
    res: Response,
    next: NextFunction
  ) {
    try {
      const foodType = await foodTypeModel.create(req.body);
      res.status(201).json(foodType);
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
    req: Request<{ _id?: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      // Support both params._id (PATCH) and body._id (PUT)
      const id = req.params._id || (req.body as any)._id;

      if (!id) {
        return res.status(400).json({ message: 'FoodType ID is required' });
      }

      const updates = req.body;
      const foodType = await foodTypeModel.update(id as any, updates);

      if (!foodType) {
        return res
          .status(404)
          .json({ message: `FoodType with ID ${id} not found.` });
      }

      res.status(200).json(foodType);
    } catch (error) {
      logger.error(
        `Failed to update foodType with ID ${req.params._id || req.body._id || 'N/A'}:`,
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
    res: Response,
    next: NextFunction
  ) {
    try {
      const { _id } = req.params;

      const foodType = await foodTypeModel.findById(new mongoose.Types.ObjectId(_id));

      if (!foodType) {
        return res
          .status(404)
          .json({ message: `FoodType with ID ${_id} not found.` });
      }

      res.status(200).json(foodType);
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
    res: Response,
    next: NextFunction
  ) {
    try {
      req;
      const { _id } = req.params;

      const foodType = await foodTypeModel.delete(new mongoose.Types.ObjectId(_id));

      if (!foodType) {
        return res
          .status(404)
          .json({ message: `FoodType with ID ${_id} not found.` });
      }

      res.status(200).json(foodType);
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

  async findFoodTypeByBarcode(
    req: Request<{ barcodeId: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { barcodeId } = req.params;

      const foodType = await foodTypeModel.findByBarcode(barcodeId);

      if (!foodType) {
        return res
          .status(404)
          .json({ message: `FoodType with barcode ${barcodeId} not found.` });
      }

      res.status(200).json(foodType);
    } catch (error) {
      logger.error(
        `Failed to get foodType with barcode ${req.params.barcodeId || 'N/A'}:`,
        error
      );

      if (error instanceof Error) {
        return res.status(500).json({
          message: error.message || 'Failed to get foodType by barcode',
        });
      }

      next(error);
    }
  }
}

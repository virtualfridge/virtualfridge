import { NextFunction, Request, Response } from 'express';

import logger from '../util/logger';
import { MediaService } from '../services/media';
import { UploadImageRequest, UploadImageResponse } from '../types/media';
import { sanitizeInput } from '../util/sanitizeInput';
import path from 'path';
import { aiVisionService } from '../services/aiVision';
import { foodTypeModel } from '../models/foodType';
import { foodItemModel } from '../models/foodItem';
import { FridgeItemResponse } from '../types/fridge';

export class MediaController {
  async uploadImage(
    req: Request<unknown, unknown, UploadImageRequest>,
    res: Response<UploadImageResponse>,
    next: NextFunction
  ) {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: 'No file uploaded',
        });
      }

      const user = (req as any).user!;
      const sanitizedFilePath = sanitizeInput(req.file.path);
      const image = await MediaService.saveImage(
        sanitizedFilePath,
        user._id.toString()
      );

      res.status(200).json({
        message: 'Image uploaded successfully',
        data: {
          image,
        },
      });
    } catch (error) {
      logger.error('Error uploading profile picture:', error);

      if (error instanceof Error) {
        return res.status(500).json({
          message: error.message || 'Failed to upload profile picture',
        });
      }

      next(error);
    }
  }

  async visionScan(
    req: Request<unknown, unknown, UploadImageRequest>,
    res: Response<FridgeItemResponse>,
    next: NextFunction
  ) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const user = (req as any).user!;
      const sanitizedFilePath = sanitizeInput(req.file.path);
      const storedPath = await MediaService.saveImage(
        sanitizedFilePath,
        user._id.toString()
      );

      const absolutePath = path.isAbsolute(storedPath)
        ? storedPath
        : path.join(process.cwd(), storedPath);

      const analysis = await aiVisionService.analyzeProduce(absolutePath);
      logger.info('Vision analysis result', analysis as any);

      if (!analysis.isProduce || !analysis.name) {
        return res.status(400).json({
          message: 'Item detected must be a fruit or vegetable',
        });
      }

      const displayName = toTitleCase(analysis.name);

      let foodType = await foodTypeModel.findByName(displayName);
      logger.info('Using produce name', { displayName });
      if (!foodType) {
        logger.info('Creating new FoodType', { name: displayName, shelfLifeDays: 14 });
        foodType = await foodTypeModel.create({
          name: displayName,
          shelfLifeDays: 14,
        } as any);
      } else {
        logger.info('Found existing FoodType', { id: (foodType as any)._id, name: foodType.name });
      }

      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 14);

      const foodItem = await foodItemModel.create({
        userId: user._id,
        typeId: foodType._id,
        expirationDate,
        percentLeft: 100,
      });
      logger.info('Created FoodItem', { id: (foodItem as any)._id, userId: user._id, typeId: foodType._id, expirationDate });

      return res.status(200).json({
        message: 'Produce item added to fridge',
        data: {
          fridgeItem: {
            foodItem,
            foodType,
          },
        },
      });
    } catch (error) {
      logger.error('Error processing vision scan:', error);
      if (error instanceof Error) {
        return res.status(500).json({
          message: error.message || 'Failed to process vision scan',
        });
      }
      next(error);
    }
  }

}

function toTitleCase(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

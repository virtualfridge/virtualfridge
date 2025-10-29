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

      if (!req.user) {
        logger.error(
          'Media controller must always be used with auth middleware!'
        );
        return res.status(500).json({
          message: 'Internal server error',
        });
      }
      const user = req.user;
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

      if (!req.user) {
        logger.error(
          'Media controller must always be used with auth middleware!'
        );
        return res.status(500).json({
          message: 'Internal server error',
        });
      }
      const user = req.user;
      const sanitizedFilePath = sanitizeInput(req.file.path);
      const storedPath = await MediaService.saveImage(
        sanitizedFilePath,
        user._id.toString()
      );

      const absolutePath = path.isAbsolute(storedPath)
        ? storedPath
        : path.join(process.cwd(), storedPath);

      const analysis = await aiVisionService.analyzeProduce(absolutePath);

      if (!analysis.isProduce || !analysis.name) {
        return res.status(400).json({
          message: 'Item detected must be a fruit or vegetable',
        });
      }

      const displayName = toTitleCase(analysis.name);

      let foodType = await foodTypeModel.findByName(displayName);
      if (!foodType) {
        foodType = await foodTypeModel.create({
          name: displayName,
          shelfLifeDays: 14,
        });
      }

      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 14);

      // If nutrients were returned from Gemini, save them on the FoodType
      if (analysis.nutrients) {
        try {
          await foodTypeModel.update(foodType._id, {
            nutrients: analysis.nutrients,
          });
          // Refresh foodType after update
          const refreshed = await foodTypeModel.findById(foodType._id);
          if (refreshed) {
            foodType = refreshed;
          }
        } catch (e) {
          logger.error('Failed to store nutrients on FoodType', e);
        }
      }

      const foodItem = await foodItemModel.create({
        userId: user._id,
        typeId: foodType._id,
        expirationDate,
        percentLeft: 100,
      });

      return res.status(200).json({
        message: 'Produce item added to fridge',
        data: {
          fridgeItem: {
            foodItem,
            foodType: foodType,
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

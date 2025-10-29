import { NextFunction, Request, Response } from 'express';

import logger from '../util/logger';
import { MediaService } from '../services/media';
import { UploadImageRequest, UploadImageResponse } from '../types/media';
import { sanitizeInput } from '../util/sanitizeInput';
import path from 'path';
import { aiVisionService, NutrientsPer100g } from '../services/aiVision';
import { foodTypeModel } from '../models/foodType';
import { foodItemModel } from '../models/foodItem';
import { FridgeItemResponse } from '../types/fridge';
import { Nutrients } from '../types/foodType';

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

      const user = req.user!;
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
          const camel = snakeToCamelNutrients(analysis.nutrients);
          await foodTypeModel.update(foodType._id, {
            nutrients: camel,
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

function snakeToCamelNutrients(n: NutrientsPer100g): Partial<Nutrients> {
  const out: Nutrients = {};
  if (n.calories) out.calories = n.calories;
  if (n.energy_kj) out.energyKj = n.energy_kj;
  if (n.protein) out.protein = n.protein;
  if (n.fat) out.fat = n.fat;
  if (n.saturated_fat) out.saturatedFat = n.saturated_fat;
  if (n.trans_fat) out.transFat = n.trans_fat;
  if (n.monounsaturated_fat) out.monounsaturatedFat = n.monounsaturated_fat;
  if (n.polyunsaturated_fat) out.polyunsaturatedFat = n.polyunsaturated_fat;
  if (n.cholesterol) out.cholesterol = n.cholesterol;
  if (n.carbs) out.carbohydrates = n.carbs;
  if (n.sugars) out.sugars = n.sugars;
  if (n.fiber) out.fiber = n.fiber;
  if (n.salt) out.salt = n.salt;
  if (n.sodium) out.sodium = n.sodium;
  if (n.calcium) out.calcium = n.calcium;
  if (n.iron) out.iron = n.iron;
  if (n.potassium) out.potassium = n.potassium;
  return out;
}

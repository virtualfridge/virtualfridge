import mongoose, { Schema } from 'mongoose';
import { FoodType, NutrientInfo, NutritionalInfo } from '../types/foodType';
import logger from '../util/logger';

// Always per 100g of source item
const nutrientInfoOpts = new Schema<NutrientInfo>({
  value: { type: Number, required: true },
  unit: { type: String, required: true },
});
const nutritionalInfoOpts = new Schema<NutritionalInfo>({
  energy: { type: nutrientInfoOpts, required: false },
  energyKcal: { type: nutrientInfoOpts, required: false },
  energyKj: { type: nutrientInfoOpts, required: false },
  fat: { type: nutrientInfoOpts, required: false },
  saturatedFat: { type: nutrientInfoOpts, required: false },
  transFat: { type: nutrientInfoOpts, required: false },
  cholesterol: { type: nutrientInfoOpts, required: false },
  salt: { type: nutrientInfoOpts, required: false },
  sodium: { type: nutrientInfoOpts, required: false },
  carbohydrates: { type: nutrientInfoOpts, required: false },
  carbohydratesTotal: { type: nutrientInfoOpts, required: false },
  fiber: { type: nutrientInfoOpts, required: false },
  sugars: { type: nutrientInfoOpts, required: false },
  addedSugars: { type: nutrientInfoOpts, required: false },
  proteins: { type: nutrientInfoOpts, required: false },
  vitaminD: { type: nutrientInfoOpts, required: false },
  calcium: { type: nutrientInfoOpts, required: false },
  iron: { type: nutrientInfoOpts, required: false },
  potassium: { type: nutrientInfoOpts, required: false },
});

const foodTypeSchema = new Schema<FoodType>({
  name: { type: String, required: true },
  shelfLifeDays: { type: Number, required: true },
  nutritionalInfo: { type: nutritionalInfoOpts, required: false },
  barcodeId: { type: String, required: false, index: true },
});

export class FoodTypeModel {
  private foodType: mongoose.Model<FoodType>;

  constructor() {
    this.foodType = mongoose.model<FoodType>('FoodType', foodTypeSchema);
  }

  async create(foodType: Partial<FoodType>): Promise<FoodType> {
    try {
      return await this.foodType.create(foodType);
    } catch (error) {
      logger.error('Error creating foodType:', error);
      throw new Error('Failed to create foodType');
    }
  }
  async update(
    foodTypeId: mongoose.Types.ObjectId,
    foodType: Partial<FoodType>
  ): Promise<FoodType | null> {
    try {
      const updatedFoodType = await this.foodType.findByIdAndUpdate(
        foodTypeId,
        foodType,
        {
          new: true,
        }
      );
      return updatedFoodType;
    } catch (error) {
      logger.error('Error updating foodType:', error);
      throw new Error('Failed to update foodType');
    }
  }
  async delete(foodTypeId: mongoose.Types.ObjectId): Promise<FoodType | null> {
    try {
      const foodType = await this.foodType.findByIdAndDelete(foodTypeId);
      return foodType;
    } catch (error) {
      logger.error('Error deleting foodType:', error);
      throw new Error('Failed to delete foodType');
    }
  }
  async findById(
    foodTypeId: mongoose.Types.ObjectId
  ): Promise<FoodType | null> {
    try {
      const foodType = await this.foodType.findById(foodTypeId);
      return foodType;
    } catch (error) {
      logger.error('Error finding foodType by id:', error);
      throw new Error('Failed to find foodType by id');
    }
  }

  async findByBarcode(barcodeId: String): Promise<FoodType | null> {
    try {
      const foodType = await this.foodType.findOne({ barcodeId });
      return foodType;
    } catch (error) {
      logger.error('Error finding foodType by barcode:', error);
      throw new Error('Failed to find foodType by barcodeId');
    }
  }
}

export const foodTypeModel = new FoodTypeModel();

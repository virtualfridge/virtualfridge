import mongoose, { Schema } from 'mongoose';
import { FoodType, Nutrients } from '../types/foodType';
import logger from '../util/logger';

// Always per 100g of source item
const nutrientsOpts = new Schema<Nutrients>({
  calories: { type: String, required: false },
  energyKj: { type: String, required: false },
  protein: { type: String, required: false },
  fat: { type: String, required: false },
  saturatedFat: { type: String, required: false },
  transFat: { type: String, required: false },
  monounsaturatedFat: { type: String, required: false },
  polyunsaturatedFat: { type: String, required: false },
  cholesterol: { type: String, required: false },
  salt: { type: String, required: false },
  sodium: { type: String, required: false },
  carbohydrates: { type: String, required: false },
  fiber: { type: String, required: false },
  sugars: { type: String, required: false },
  calcium: { type: String, required: false },
  iron: { type: String, required: false },
  potassium: { type: String, required: false },
});

const foodTypeSchema = new Schema<FoodType>({
  name: { type: String, required: true },
  nutrients: { type: nutrientsOpts, required: false },
  shelfLifeDays: { type: Number, required: false },
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

  async findByBarcode(barcodeId: string): Promise<FoodType | null> {
    try {
      const foodType = await this.foodType.findOne({ barcodeId });
      return foodType;
    } catch (error) {
      logger.error('Error finding foodType by barcode:', error);
      throw new Error('Failed to find foodType by barcodeId');
    }
  }

  async findByName(name: string): Promise<FoodType | null> {
    try {
      const foodType = await this.foodType.findOne({ name });
      return foodType;
    } catch (error) {
      logger.error('Error finding foodType by name:', error);
      throw new Error('Failed to find foodType by name');
    }
  }
}

export const foodTypeModel = new FoodTypeModel();

import mongoose, { Schema } from 'mongoose';
import {
  createFoodItemSchema,
  IFoodItem,
  INutrientInfo,
  updateFoodItemSchema,
} from '../types/foodItem';
import logger from '../util/logger';

const nutrientInfoOpts = new Schema<INutrientInfo>({
  value: { type: Number, required: false },
  unit: { type: String, required: false },
  perSourceValue: { type: Number, required: false },
  perSourceUnit: { type: String, required: false },
});
const nutritionalInfoOpts = {
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
};
// TODO: move nutritional info to the food type definition only and as SSOT
const foodItemSchema = new Schema<IFoodItem>({
  typeId: { type: mongoose.Schema.Types.ObjectId, required: true },
  barcodeId: { type: String, required: false },
  expirationDate: { type: Date, required: true },
  nutritionalInfo: nutritionalInfoOpts,
  amount: { type: Number, required: true },
  amountUnit: { type: String, required: true },
});

export class FoodItemModel {
  private foodItem: mongoose.Model<IFoodItem>;

  constructor() {
    this.foodItem = mongoose.model<IFoodItem>('FoodItem', foodItemSchema);
  }

  // TODO: implement these functions
  async create(foodItem: Partial<IFoodItem>): Promise<IFoodItem> {
    try {
      return await this.foodItem.create(foodItem);
    } catch (error) {
      logger.error('Error creating foodItem:', error);
      throw new Error('Failed to create foodItem');
    }
  }
  async update(
    foodItemId: mongoose.Types.ObjectId,
    foodItem: Partial<IFoodItem>
  ): Promise<IFoodItem | null> {
    try {
      const updatedFoodItem = await this.foodItem.findByIdAndUpdate(
        foodItemId,
        foodItem,
        {
          new: true,
        }
      );
      return updatedFoodItem;
    } catch (error) {
      logger.error('Error updating foodItem:', error);
      throw new Error('Failed to update foodItem');
    }
  }
  async delete(foodItemId: mongoose.Types.ObjectId): Promise<IFoodItem | null> {
    try {
      const foodItem = await this.foodItem.findByIdAndDelete(foodItemId);
      return foodItem;
    } catch (error) {
      logger.error('Error deleting foodItem:', error);
      throw new Error('Failed to delete foodItem');
    }
  }
  async get(foodItemId: mongoose.Types.ObjectId): Promise<IFoodItem | null> {
    try {
      const foodItem = await this.foodItem.findById(foodItemId);
      return foodItem;
    } catch (error) {
      logger.error('Error getting foodItem:', error);
      throw new Error('Failed to get foodItem');
    }
  }
}

export const foodItemModel = new FoodItemModel();

import mongoose, { Schema } from 'mongoose';
import { FoodItem } from '../types/foodItem';
import logger from '../util/logger';

// TODO: move nutritional info to the food type definition only and as SSOT
const foodItemSchema = new Schema<FoodItem>({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  typeId: { type: mongoose.Schema.Types.ObjectId, required: true },
  expirationDate: { type: Date, required: false },
  percentLeft: { type: Number, required: true },
});

export class FoodItemModel {
  private foodItem: mongoose.Model<FoodItem>;

  constructor() {
    this.foodItem = mongoose.model<FoodItem>('FoodItem', foodItemSchema);
  }

  async create(foodItem: Partial<FoodItem>): Promise<FoodItem> {
    try {
      return await this.foodItem.create(foodItem);
    } catch (error) {
      logger.error('Error creating foodItem:', error);
      throw new Error('Failed to create foodItem');
    }
  }
  async update(
    foodItemId: mongoose.Types.ObjectId,
    foodItem: Partial<FoodItem>
  ): Promise<FoodItem | null> {
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
  async delete(foodItemId: mongoose.Types.ObjectId): Promise<FoodItem | null> {
    try {
      const foodItem = await this.foodItem.findByIdAndDelete(foodItemId);
      return foodItem;
    } catch (error) {
      logger.error('Error deleting foodItem:', error);
      throw new Error('Failed to delete foodItem');
    }
  }
  async findById(
    foodItemId: mongoose.Types.ObjectId
  ): Promise<FoodItem | null> {
    try {
      const foodItem = await this.foodItem.findById(foodItemId);
      return foodItem;
    } catch (error) {
      logger.error('Error finding foodItem by id:', error);
      throw new Error('Failed to find foodItem by id');
    }
  }

  async findByUserId(
    userId: mongoose.Types.ObjectId
  ): Promise<FoodItem | null> {
    try {
      const foodItem = await this.foodItem.findOne({ userId });
      return foodItem;
    } catch (error) {
      logger.error('Error finding foodItem by userId:', error);
      throw new Error('Failed to find foodItem by userId');
    }
  }

  async findAllByUserId(
    userId: mongoose.Types.ObjectId
  ): Promise<FoodItem[]> {
    try {
      const foodItems = await this.foodItem.find({ userId });
      return foodItems;
    } catch (error) {
      logger.error('Error finding foodItems by userId:', error);
      throw new Error('Failed to find foodItems by userId');
    }
  }
}

export const foodItemModel = new FoodItemModel();

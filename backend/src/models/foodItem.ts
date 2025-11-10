import mongoose, { Schema } from 'mongoose';
import { IFoodItem } from '../types/foodItem';
import logger from '../util/logger';
import { foodTypeModel } from './foodType';
import { IFoodType } from '../types/foodType';

// TODO: move nutritional info to the food type definition only and as SSOT
const foodItemSchema = new Schema<IFoodItem>({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  typeId: { type: mongoose.Schema.Types.ObjectId, required: true },
  expirationDate: { type: Date, required: false },
  percentLeft: { type: Number, required: true },
});

export class FoodItemModel {
  private foodItem: mongoose.Model<IFoodItem>;

  constructor() {
    this.foodItem = mongoose.model<IFoodItem>('FoodItem', foodItemSchema);
  }

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
  async findById(
    foodItemId: mongoose.Types.ObjectId
  ): Promise<IFoodItem | null> {
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
  ): Promise<IFoodItem | null> {
    try {
      const foodItem = await this.foodItem.findOne({ userId });
      return foodItem;
    } catch (error) {
      logger.error('Error finding foodItem by userId:', error);
      throw new Error('Failed to find foodItem by userId');
    }
  }

  async findAllByUserId(userId: mongoose.Types.ObjectId): Promise<IFoodItem[]> {
    try {
      const foodItems = await this.foodItem.find({ userId });
      return foodItems;
    } catch (error) {
      logger.error('Error finding foodItems by userId:', error);
      throw new Error('Failed to find foodItems by userId');
    }
  }

  async getAssociatedFoodType(foodItem: IFoodItem): Promise<IFoodType> {
    try {
      const foodType = await foodTypeModel.findById(foodItem.typeId);
      if (foodType) {
        return foodType;
      } else {
        throw new Error(
          `FoodType with _id ${foodItem.typeId} not found in database`
        );
      }
    } catch (error) {
      logger.error(
        `Error finding associated foodType for foodItem ${foodItem._id}:`,
        error
      );
      throw new Error('Failed to find associated foodType');
    }
  }
}

export const foodItemModel = new FoodItemModel();

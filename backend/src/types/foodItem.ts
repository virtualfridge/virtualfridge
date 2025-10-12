import mongoose, { Document } from 'mongoose';
import z from 'zod';

// Model

export interface IFoodItem extends Document {
  _id: mongoose.Types.ObjectId;
  typeId: mongoose.Types.ObjectId;
  barcodeId?: string;
  expirationDate: Date;
  nutritionalInfo: NutritionalInfo;
  amount: number;
  amountUnit: string; // TODO: consider using a Unit enum for all units
}

export interface INutrientInfo {
  value: number;
  unit: string;
  perSourceValue: number;
  perSourceUnit: string;
}

export type NutritionalInfo = {
  energy?: INutrientInfo;
  energyKcal?: INutrientInfo;
  energyKj?: INutrientInfo;
  fat?: INutrientInfo;
  saturatedFat?: INutrientInfo;
  transFat?: INutrientInfo;
  cholesterol?: INutrientInfo;
  salt?: INutrientInfo;
  sodium?: INutrientInfo;
  carbohydrates?: INutrientInfo;
  carbohydratesTotal?: INutrientInfo;
  fiber?: INutrientInfo;
  sugars?: INutrientInfo;
  addedSugars?: INutrientInfo;
  proteins?: INutrientInfo;
  vitaminD?: INutrientInfo;
  calcium?: INutrientInfo;
  iron?: INutrientInfo;
  potassium?: INutrientInfo;
};

// Zod schemas
// TODO: complete these
export const createFoodItemSchema = z.object({});

export const updateFoodItemSchema = z.object({});

export const getFoodItemSchema = z.object({
  id: z.custom<mongoose.Types.ObjectId>(),
});

export const deleteFoodItemSchema = z.object({
  id: z.custom<mongoose.Types.ObjectId>(),
});

// Request types
export type CreateFoodItemRequest = z.infer<typeof createFoodItemSchema>;
export type UpdateFoodItemRequest = z.infer<typeof updateFoodItemSchema>;
export type GetFoodItemRequest = z.infer<typeof getFoodItemSchema>;
export type DeleteFoodItemRequest = z.infer<typeof deleteFoodItemSchema>;

export type FoodItemResponse = {
  message: string;
  data?: {
    foodItem: IFoodItem;
  };
};

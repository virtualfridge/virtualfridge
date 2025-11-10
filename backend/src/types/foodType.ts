import mongoose from 'mongoose';
import z from 'zod';

// Zod schemas

// Any changes to these schemas should also be made to the corresponding mongoose schemas in models/foodType.ts

// Always per 100g of source item
export const nutrientsSchema = z.object({
  calories: z.string().optional(),
  energyKj: z.string().optional(),
  protein: z.string().optional(),
  fat: z.string().optional(),
  saturatedFat: z.string().optional(),
  transFat: z.string().optional(),
  monounsaturatedFat: z.string().optional(),
  polyunsaturatedFat: z.string().optional(),
  cholesterol: z.string().optional(),
  salt: z.string().optional(),
  sodium: z.string().optional(),
  carbohydrates: z.string().optional(),
  fiber: z.string().optional(),
  sugars: z.string().optional(),
  calcium: z.string().optional(),
  iron: z.string().optional(),
  magnesium: z.string().optional(),
  zinc: z.string().optional(),
  potassium: z.string().optional(),
  caffeine: z.string().optional(),
});

export type Nutrients = z.infer<typeof nutrientsSchema>;
export interface INutrients {
  calories?: string;
  energyKj?: string;
  protein?: string;
  fat?: string;
  saturatedFat?: string;
  transFat?: string;
  monounsaturatedFat?: string;
  polyunsaturatedFat?: string;
  cholesterol?: string;
  salt?: string;
  sodium?: string;
  carbohydrates?: string;
  fiber?: string;
  sugars?: string;
  calcium?: string;
  iron?: string;
  magnesium?: string;
  zinc?: string;
  potassium?: string;
  caffeine?: string;
}

export const foodTypeSchema = z.object({
  _id: z.custom<mongoose.Types.ObjectId>(),
  name: z.string(),
  nutrients: nutrientsSchema.optional(),
  shelfLifeDays: z.number().optional(),
  barcodeId: z.string().optional(),
  brand: z.string().optional(),
  image: z.url().optional(),
  allergens: z.array(z.string()),
});

export type FoodType = z.infer<typeof foodTypeSchema>;

export interface IFoodType {
  _id: mongoose.Types.ObjectId;
  name: string;
  nutrients?: INutrients;
  shelfLifeDays?: string;
  barcodeId?: string;
  brand?: string;
  image?: string;
  allergens: string[];
}

export const createFoodTypeSchema = foodTypeSchema.omit({
  _id: true,
});

export const updateFoodTypeSchema = foodTypeSchema
  .partial()
  .required({ _id: true });

export const findFoodTypeSchema = foodTypeSchema.pick({ _id: true });

export const deleteFoodTypeSchema = foodTypeSchema.pick({ _id: true });

// Request types
export type CreateFoodTypeBody = z.infer<typeof createFoodTypeSchema>;
export type UpdateFoodTypeBody = z.infer<typeof updateFoodTypeSchema>;
export type FindFoodTypeParams = z.infer<typeof findFoodTypeSchema>;
export type DeleteFoodTypeParams = z.infer<typeof deleteFoodTypeSchema>;

export interface FoodTypeResponse {
  message: string;
  data?: {
    foodType: FoodType;
  };
}

import mongoose from 'mongoose';
import z from 'zod';

// Zod schemas

// Any changes to these schemas should also be made to the corresponding mongoose schemas in models/foodType.ts
// Always per 100g of source item
export const nutrientInfoSchema = z.object({
  value: z.number().positive(),
  unit: z.string(),
});

export type NutrientInfo = z.infer<typeof nutrientInfoSchema>;

export const nutritionalInfoSchema = z.object({
  energy: nutrientInfoSchema.optional(),
  energyKcal: nutrientInfoSchema.optional(),
  energyKj: nutrientInfoSchema.optional(),
  fat: nutrientInfoSchema.optional(),
  saturatedFat: nutrientInfoSchema.optional(),
  transFat: nutrientInfoSchema.optional(),
  cholesterol: nutrientInfoSchema.optional(),
  salt: nutrientInfoSchema.optional(),
  sodium: nutrientInfoSchema.optional(),
  carbohydrates: nutrientInfoSchema.optional(),
  carbohydratesTotal: nutrientInfoSchema.optional(),
  fiber: nutrientInfoSchema.optional(),
  sugars: nutrientInfoSchema.optional(),
  addedSugars: nutrientInfoSchema.optional(),
  proteins: nutrientInfoSchema.optional(),
  vitaminD: nutrientInfoSchema.optional(),
  calcium: nutrientInfoSchema.optional(),
  iron: nutrientInfoSchema.optional(),
  potassium: nutrientInfoSchema.optional(),
});

export type NutritionalInfo = z.infer<typeof nutritionalInfoSchema>;

export const foodTypeSchema = z.object({
  _id: z.custom<mongoose.Types.ObjectId>(),
  name: z.string(),
  shelfLifeDays: z.number(),
  nutritionalInfo: nutritionalInfoSchema.optional(),
  barcodeId: z.string().optional(),
});

export type FoodType = z.infer<typeof foodTypeSchema>;

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

export type FoodTypeResponse = {
  message: string;
  data?: {
    foodType: FoodType;
  };
};

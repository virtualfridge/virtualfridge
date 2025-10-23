import mongoose from 'mongoose';
import z from 'zod';
import { foodTypeSchema } from './foodType';

// Zod schemas

// Any changes to this schema should also be made to the mongoose schema in models/foodItem.ts
export const foodItemSchema = z.object({
  _id: z.custom<mongoose.Types.ObjectId>(),
  userId: z.custom<mongoose.Types.ObjectId>(),
  typeId: z.custom<mongoose.Types.ObjectId>(),
  expirationDate: z.date().optional(),
  percentLeft: z.number().positive().max(100),
});

export type FoodItem = z.infer<typeof foodItemSchema>;

export const createFoodItemSchema = foodItemSchema
  .omit({
    _id: true,
    typeId: true,
  })
  .extend(foodTypeSchema.omit({ _id: true }).partial().shape);

export const updateFoodItemSchema = foodItemSchema
  .partial()
  .omit({
    userId: true,
    typeId: true,
    barcodeId: true,
  })
  .required({ _id: true });

export const findFoodItemSchema = foodItemSchema.pick({ _id: true });

export const deleteFoodItemSchema = foodItemSchema.pick({ _id: true });

// Request types
export type CreateFoodItemBody = z.infer<typeof createFoodItemSchema>;
export type UpdateFoodItemBody = z.infer<typeof updateFoodItemSchema>;
export type FindFoodItemParams = z.infer<typeof findFoodItemSchema>;
export type DeleteFoodItemParams = z.infer<typeof deleteFoodItemSchema>;

export type FoodItemResponse = {
  message: string;
  data?: {
    foodItem: FoodItem;
  };
};

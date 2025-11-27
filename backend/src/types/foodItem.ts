import mongoose from 'mongoose';
import z from 'zod';
import { objectIdSchema } from './common';

// Zod schemas

// Any changes to this schema should also be made to the mongoose schema in models/foodItem.ts
export const foodItemSchema = z.object({
  _id: objectIdSchema,
  userId: objectIdSchema,
  typeId: objectIdSchema,
  expirationDate: z.coerce.date().optional(),
  percentLeft: z.number().min(0).max(100),
});

export interface IFoodItem {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  typeId: mongoose.Types.ObjectId;
  expirationDate?: Date;
  percentLeft: number;
}

export const createFoodItemSchema = foodItemSchema.omit({
  _id: true,
});

export const updateFoodItemSchema = foodItemSchema
  .partial()
  .omit({
    userId: true,
    typeId: true,
  })
  .required({ _id: true });

export const findFoodItemByIdSchema = foodItemSchema.pick({ _id: true });

export const deleteFoodItemSchema = foodItemSchema.pick({ _id: true });

// Request types
export type CreateFoodItemBody = z.infer<typeof createFoodItemSchema>;
export type UpdateFoodItemBody = z.infer<typeof updateFoodItemSchema>;
export type FindFoodItemByIdParams = z.infer<typeof findFoodItemByIdSchema>;
export type DeleteFoodItemParams = z.infer<typeof deleteFoodItemSchema>;

export interface FoodItemResponse {
  message: string;
  data?: {
    foodItem: IFoodItem;
  };
}

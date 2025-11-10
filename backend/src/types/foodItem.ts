import mongoose from 'mongoose';
import z from 'zod';

// Zod schemas

// Any changes to this schema should also be made to the mongoose schema in models/foodItem.ts
export const foodItemSchema = z.object({
  _id: z.custom<mongoose.Types.ObjectId>(),
  userId: z.custom<mongoose.Types.ObjectId>(),
  typeId: z.custom<mongoose.Types.ObjectId>(),
  expirationDate: z.coerce.date().optional(),
  percentLeft: z.number().min(0).max(100),
});

export type FoodItem = z.infer<typeof foodItemSchema>;

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
    foodItem: FoodItem;
  };
};

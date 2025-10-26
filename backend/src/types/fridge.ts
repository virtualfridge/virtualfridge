import z from 'zod';
import { FoodItem } from './foodItem';
import { FoodType } from './foodType';

export const barcodeRequestSchema = z.object({
  barcode: z.string().min(1, 'Barcode cannot be empty'),
});

export type barcodeRequestBody = z.infer<typeof barcodeRequestSchema>;

export type FridgeItem = {
  foodItem: FoodItem;
  foodType: FoodType;
};

export type FridgeItemsResponse = {
  message: string;
  data?: {
    fridgeItems: FridgeItem[];
  };
};

export type FridgeItemResponse = {
  message: string;
  data?: {
    fridgeItem: FridgeItem;
  };
};

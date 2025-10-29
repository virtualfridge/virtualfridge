import z from 'zod';
import { FoodItem } from './foodItem';
import { FoodType } from './foodType';

export const barcodeRequestSchema = z.object({
  barcode: z.string().min(1, 'Barcode cannot be empty'),
});

export type barcodeRequestBody = z.infer<typeof barcodeRequestSchema>;

export interface FridgeItem {
  foodItem: FoodItem;
  foodType: FoodType;
}

export interface FridgeItemsResponse {
  message: string;
  data?: {
    fridgeItems: FridgeItem[];
  };
}

export interface FridgeItemResponse {
  message: string;
  data?: {
    fridgeItem: FridgeItem;
  };
}

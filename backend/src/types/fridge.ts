import z from 'zod';
import { IFoodItem } from './foodItem';
import { IFoodType } from './foodType';

export const barcodeRequestSchema = z.object({
  barcode: z.string().min(1, 'Barcode cannot be empty'),
});

export type barcodeRequestBody = z.infer<typeof barcodeRequestSchema>;

export interface FridgeItem {
  foodItem: IFoodItem;
  foodType: IFoodType;
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

import { FoodItem } from './foodItem';
import { FoodType } from './foodType';
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

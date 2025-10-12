import { Router } from 'express';
import { FoodItemController } from '../controllers/foodItem';
import { validateBody, validateParams } from '../middleware/validation';
import {
  CreateFoodItemRequest,
  createFoodItemSchema,
  DeleteFoodItemRequest,
  deleteFoodItemSchema,
  GetFoodItemRequest,
  getFoodItemSchema,
  UpdateFoodItemRequest,
  updateFoodItemSchema,
} from '../types/foodItem';

const router = Router();
const foodItemController = new FoodItemController();

router.post(
  '/',
  validateBody<CreateFoodItemRequest>(createFoodItemSchema),
  foodItemController.createFoodItem
);

router.put(
  '/',
  validateBody<UpdateFoodItemRequest>(updateFoodItemSchema),
  foodItemController.updateFoodItem
);

router.get(
  '/{:id}',
  validateParams<GetFoodItemRequest>(getFoodItemSchema),
  foodItemController.getFoodItem
);

router.delete(
  '/{:id}',
  validateParams<DeleteFoodItemRequest>(deleteFoodItemSchema),
  foodItemController.deleteFoodItem
);

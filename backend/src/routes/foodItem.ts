import { Router } from 'express';
import { FoodItemController } from '../controllers/foodItem';
import { validateBody, validateParams } from '../middleware/validation';
import {
  CreateFoodItemBody,
  createFoodItemSchema,
  DeleteFoodItemParams,
  deleteFoodItemSchema,
  FindFoodItemParams,
  findFoodItemSchema,
  UpdateFoodItemBody,
  updateFoodItemSchema,
} from '../types/foodItem';

const router = Router();
const foodItemController = new FoodItemController();

router.post(
  '/',
  validateBody<CreateFoodItemBody>(createFoodItemSchema),
  foodItemController.createFoodItem
);

router.put(
  '/',
  validateBody<UpdateFoodItemBody>(updateFoodItemSchema),
  foodItemController.updateFoodItem
);

router.get(
  '/:_id',
  validateParams<FindFoodItemParams>(findFoodItemSchema),
  foodItemController.findFoodItemById
);

router.delete(
  '/:_id',
  validateParams<DeleteFoodItemParams>(deleteFoodItemSchema),
  foodItemController.deleteFoodItem
);

export default router;

import { Router } from 'express';
import { FoodTypeController } from '../controllers/foodType';
import { validateBody, validateParams } from '../middleware/validation';
import {
  CreateFoodTypeBody,
  createFoodTypeSchema,
  DeleteFoodTypeParams,
  deleteFoodTypeSchema,
  FindFoodTypeParams,
  findFoodTypeSchema,
  UpdateFoodTypeBody,
  updateFoodTypeSchema,
} from '../types/foodType';

const router = Router();
const foodTypeController = new FoodTypeController();

router.post(
  '/',
  validateBody<CreateFoodTypeBody>(createFoodTypeSchema),
  foodTypeController.createFoodType
);

router.put(
  '/',
  validateBody<UpdateFoodTypeBody>(updateFoodTypeSchema),
  foodTypeController.updateFoodType
);

router.get(
  '/:_id',
  validateParams<FindFoodTypeParams>(findFoodTypeSchema),
  foodTypeController.findFoodTypeById
);

router.delete(
  '/:_id',
  validateParams<DeleteFoodTypeParams>(deleteFoodTypeSchema),
  foodTypeController.deleteFoodType
);

export default router;

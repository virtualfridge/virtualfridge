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
  foodTypeController.createFoodType.bind(foodTypeController)
);

router.put(
  '/:_id',
  validateParams<FindFoodTypeParams>(findFoodTypeSchema),
  validateBody(updateFoodTypeSchema),
  foodTypeController.updateFoodType.bind(foodTypeController)
);

router.patch(
  '/:_id',
  validateParams<FindFoodTypeParams>(findFoodTypeSchema),
  foodTypeController.updateFoodType.bind(foodTypeController)
);

router.get(
  '/barcode/:barcodeId',
  foodTypeController.findFoodTypeByBarcode.bind(foodTypeController)
);

router.get(
  '/:_id',
  validateParams<FindFoodTypeParams>(findFoodTypeSchema),
  foodTypeController.findFoodTypeById.bind(foodTypeController)
);

router.delete(
  '/:_id',
  validateParams<DeleteFoodTypeParams>(deleteFoodTypeSchema),
  foodTypeController.deleteFoodType.bind(foodTypeController)
);

export default router;

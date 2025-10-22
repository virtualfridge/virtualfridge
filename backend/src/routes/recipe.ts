import { Router } from 'express';

import { RecipeController } from '../controllers/recipe';
import { validateQuery } from '../middleware/validation';
import { getRecipesQuerySchema } from '../types/recipe';

const router = Router();
const recipeController = new RecipeController();

router.get(
  '/',
  validateQuery(getRecipesQuerySchema),
  recipeController.getRecipes
);

export default router;

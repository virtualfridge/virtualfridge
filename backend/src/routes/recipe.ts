import { Router } from 'express';

import { RecipeController } from '../controllers/recipe';
import { validateBody, validateQuery } from '../middleware/validation';
import {
  getRecipesQuerySchema,
  aiRecipeRequestSchema,
  AiRecipeRequestBody,
} from '../types/recipe';

const router = Router();
const recipeController = new RecipeController();

router.get(
  '/',
  validateQuery(getRecipesQuerySchema),
  recipeController.getRecipes
);

router.post(
  '/ai',
  validateBody<AiRecipeRequestBody>(aiRecipeRequestSchema),
  recipeController.generateAiRecipe
);

export default router;

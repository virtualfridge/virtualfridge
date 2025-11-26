import { NextFunction, Request, Response } from 'express';

import { RecipeService } from '../services/recipe';
import { AiRecipeService } from '../services/aiRecipe';
import {
  GetRecipesQuery,
  GetRecipesResponse,
  defaultRecipeIngredients,
  AiRecipeRequestBody,
  AiRecipeResponse,
  ApiKeyError,
} from '../types/recipe';
import logger from '../util/logger';
import { AxiosError } from 'axios';

export class RecipeController {
  constructor(
    private readonly recipeService = new RecipeService(),
    private readonly aiRecipeService = new AiRecipeService()
  ) {}

  getRecipes = async (
    req: Request<unknown, unknown, unknown, GetRecipesQuery>,
    res: Response<GetRecipesResponse>,
    next: NextFunction
  ) => {
    const ingredientList = req.query.ingredients?.length
      ? req.query.ingredients
      : defaultRecipeIngredients;

    try {
      const recipes = await this.recipeService.getRecipes({
        ingredients: ingredientList,
      });
      if (recipes.length == 0) {
        logger.debug('No recipes found; returning 404');
        return res.status(404).json({
          message: 'No recipes found',
        });
      }

      return res.status(200).json({
        message: 'Recipes fetched successfully',
        data: {
          recipes,
        },
      });
    } catch (error) {
      logger.error('Failed to fetch recipes', error);

      if (error instanceof AxiosError) {
        return res.status(503).json({
          message: 'Failed to fetch recipes from TheMealDB service.',
        });
      }

      next(error);
    }
  };

  generateAiRecipe = async (
    req: Request<unknown, unknown, AiRecipeRequestBody>,
    res: Response<AiRecipeResponse>,
    next: NextFunction
  ) => {
    try {
      const data = await this.aiRecipeService.generateRecipe(
        req.body.ingredients
      );

      res.status(200).json({
        message: 'AI recipe generated successfully',
        data,
      });
    } catch (error) {
      logger.error('Failed to generate AI recipe', error);
      if (error instanceof ApiKeyError) {
        // We shouldn't let the user know that we have not set Gemini Api key correctly
        return res.status(500).json({ message: 'Internal server error' });
      }
      if (error instanceof AxiosError) {
        return res
          .status(502)
          .json({ message: 'Failed to connect to Gemini servers' });
      }
      // Response was empty
      if (error instanceof Error) {
        return res.status(502).json({
          message: 'Failed to generate recipe with Gemini.',
        });
      }

      next(error);
    }
  };
}

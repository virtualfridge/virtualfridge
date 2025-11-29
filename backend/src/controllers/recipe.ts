import { NextFunction, Request, Response } from 'express';

import { RecipeService } from '../services/recipe';
import {
  GetRecipesQuery,
  GetRecipesResponse,
  defaultRecipeIngredients,
  AiRecipeRequestBody,
} from '../types/recipe';
import logger from '../util/logger';
import { AxiosError } from 'axios';

export class RecipeController {
  constructor(private readonly recipeService = new RecipeService()) {}

  getRecipes = async (
    req: Request<unknown, unknown, unknown, GetRecipesQuery>,
    res: Response<GetRecipesResponse>,
    next: NextFunction
  ) => {
    const ingredientList = req.query.ingredients?.length
      ? req.query.ingredients
      : defaultRecipeIngredients;

    try {
      const recipe = await this.recipeService.getRecipe({
        ingredients: ingredientList,
      });
      if (recipe == null) {
        logger.debug('No recipes found; returning 404');
        return res.status(404).json({
          message: 'No recipes found',
        });
      }
      logger.debug('Fetched recipe from TheMealDB:', recipe);

      return res.status(200).json({
        message: 'Recipes fetched successfully',
        data: {
          recipe,
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
    res: Response<GetRecipesResponse>,
    next: NextFunction
  ) => {
    try {
      const recipe = await this.recipeService.generateRecipe(
        req.body.ingredients
      );

      res.status(200).json({
        message: 'AI recipe generated successfully',
        data: {
          recipe,
        },
      });
    } catch (error) {
      logger.error('Failed to generate AI recipe', error);
      if (error instanceof AxiosError) {
        return res
          .status(502)
          .json({ message: 'Failed to connect to Gemini servers' });
      }
      // Response was invalid
      if (error instanceof Error) {
        return res.status(502).json({
          message: 'Failed to generate recipe with Gemini.',
        });
      }

      next(error);
    }
  };
}

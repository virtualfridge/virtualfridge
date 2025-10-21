import { NextFunction, Request, Response } from 'express';

import { RecipeService } from '../services/recipe';
import {
  GetRecipesQuery,
  GetRecipesResponse,
  defaultRecipeIngredients,
} from '../types/recipe';
import logger from '../util/logger';

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
      const meals = await this.recipeService.fetchRecipes({
        ingredients: ingredientList,
      });

      res.status(200).json({
        message: 'Recipes fetched successfully',
        data: {
          ingredients: ingredientList,
          meals,
          externalSource: this.recipeService.getExternalSourceLink(),
        },
      });
    } catch (error) {
      logger.error('Failed to fetch recipes', error);

      if (error instanceof Error) {
        return res.status(502).json({
          message:
            error.message ||
            'Failed to fetch recipes from TheMealDB service.',
          data: {
            ingredients: ingredientList,
            meals: [],
            externalSource: this.recipeService.getExternalSourceLink(),
          },
        });
      }

      next(error);
    }
  };
}

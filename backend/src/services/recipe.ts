import axios from 'axios';

import logger from '../util/logger';
import {
  RecipeApiResponse,
  RecipeSummary,
  RecipeQuery,
  defaultRecipeIngredients,
} from '../types/recipe';

const DEFAULT_API_BASE_URL = 'https://www.themealdb.com/api/json/v1/1';
const FILTER_ENDPOINT = '/filter.php';

export class RecipeService {
  private readonly apiBaseUrl: string;

  constructor(apiBaseUrl = process.env.THEMEALDB_BASE_URL ?? DEFAULT_API_BASE_URL) {
    this.apiBaseUrl = apiBaseUrl.replace(/\/$/, '');
  }

  async fetchRecipes(query: RecipeQuery): Promise<RecipeSummary[]> {
    const ingredients = query.ingredients?.length
      ? query.ingredients
      : defaultRecipeIngredients;

    const ingredientParam = ingredients.join(',');

    const requestUrl = `${this.apiBaseUrl}${FILTER_ENDPOINT}`;

    logger.info(
      `Fetching recipes from TheMealDB with ingredients: ${ingredientParam}`
    );

    const response = await axios.get<RecipeApiResponse>(requestUrl, {
      params: { i: ingredientParam },
    });

    const meals = response.data.meals ?? [];

    logger.debug(
      `Received ${meals.length} meals from TheMealDB for ${ingredientParam}`
    );

    return meals;
  }

  getExternalSourceLink(): string {
    return `${this.apiBaseUrl}${FILTER_ENDPOINT}`;
  }
}

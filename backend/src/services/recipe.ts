import axios from 'axios';

import logger from '../util/logger';
import {
  RecipeApiSummaryResponse,
  RecipeApiSummary,
  RecipeQuery,
  defaultRecipeIngredients,
  RecipeApiResponse,
  Recipe,
} from '../types/recipe';

const DEFAULT_API_BASE_URL = 'https://www.themealdb.com/api/json/v1/1';
const FILTER_ENDPOINT = '/filter.php';
const LOOKUP_ENDPOINT = '/lookup.php';

export class RecipeService {
  private readonly apiBaseUrl: string;

  constructor(
    apiBaseUrl = process.env.THEMEALDB_BASE_URL ?? DEFAULT_API_BASE_URL
  ) {
    this.apiBaseUrl = apiBaseUrl.replace(/\/$/, '');
  }

  async getRecipes(query: RecipeQuery): Promise<Recipe[]> {
    const ingredients = query.ingredients?.length
      ? query.ingredients
      : defaultRecipeIngredients;
    const mealsToIngredients = new Map<string, Set<string>>();
    const promises = ingredients.map(async ingredient => {
      const recipes = await this.queryRecipesByIngredient(ingredient);
      recipes.forEach(recipe => {
        if (mealsToIngredients.get(recipe.idMeal) !== undefined) {
          mealsToIngredients.get(recipe.idMeal)?.add(ingredient);
        } else {
          mealsToIngredients.set(recipe.idMeal, new Set<string>([ingredient]));
        }
      });
    });
    await Promise.all(promises);
    var recipeIds: string[] = [];
    [...mealsToIngredients.entries()].forEach(entry => {
      if (entry[1].size == query.ingredients?.length) {
        recipeIds.push(entry[0]);
      }
    });
    var recipes: Recipe[] = [];
    const recipePromises = recipeIds.map(async id => {
      const recipe = await this.getRecipe(id);
      if (recipe.meals) {
        recipes = recipes.concat(recipe.meals);
      }
    });
    await Promise.all(recipePromises);
    return recipes;
  }

  private async queryRecipesByIngredient(
    ingredient: string
  ): Promise<RecipeApiSummary[]> {
    const requestUrl = `${this.apiBaseUrl}${FILTER_ENDPOINT}`;

    logger.info(
      `Fetching recipes from TheMealDB with ingredient: ${ingredient}`
    );

    const response = await axios.get<RecipeApiSummaryResponse>(requestUrl, {
      params: { i: ingredient },
    });

    const meals = response.data.meals ?? [];

    logger.debug(
      `Received ${meals.length} meals from TheMealDB for ${ingredient}`
    );

    return meals;
  }

  private async getRecipe(id: string): Promise<RecipeApiResponse> {
    const requestUrl = `${this.apiBaseUrl}${LOOKUP_ENDPOINT}`;
    const response = await axios.get<RecipeApiResponse>(requestUrl, {
      params: { i: id },
    });
    return response.data;
  }

  getExternalSourceLink(): string {
    return `${this.apiBaseUrl}${FILTER_ENDPOINT}`;
  }
}

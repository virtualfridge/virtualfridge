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
import { foodTypeModel } from '../models/foodType';
import { IFoodType, INutrients } from '../types/foodType';

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
    // Now we score the recipes based on nutrition facts
    // What we have:
    // A list of ingredients
    // A list of their measurements as strings :(
    // The nutrition facts for the foods that are in the database
    const badNutrients: Array<keyof INutrients> = [
      'fat',
      'saturatedFat',
      'transFat',
      'sugars',
    ];
    const goodNutrients: Array<keyof INutrients> = [
      'fiber',
      'calcium',
      'iron',
      'magnesium',
      'zinc',
      'potassium',
    ];
    var scorePromises = recipes.map(async recipe => {
      const ingredients = [
        recipe.strIngredient1,
        recipe.strIngredient2,
        recipe.strIngredient2,
        recipe.strIngredient3,
        recipe.strIngredient4,
        recipe.strIngredient5,
        recipe.strIngredient6,
        recipe.strIngredient7,
        recipe.strIngredient8,
        recipe.strIngredient9,
        recipe.strIngredient10,
        recipe.strIngredient11,
        recipe.strIngredient12,
        recipe.strIngredient13,
        recipe.strIngredient14,
        recipe.strIngredient15,
        recipe.strIngredient16,
        recipe.strIngredient17,
        recipe.strIngredient18,
        recipe.strIngredient19,
        recipe.strIngredient20,
      ];
      const foodTypePromises = ingredients.map(
        async ingredient => await foodTypeModel.findByName(ingredient)
      );

      const foodTypes = await Promise.all(foodTypePromises);

      return foodTypes
        .filter(foodType => foodType !== null)
        .reduce((currentScore: number, foodType) => {
          var newScore = currentScore;
          if (!foodType) {
            return currentScore;
          }
          for (const nutrient of goodNutrients) {
            newScore += this.getPercentDailyValue(nutrient, foodType);
          }
          for (const nutrient of badNutrients) {
            newScore -= this.getPercentDailyValue(nutrient, foodType);
          }
          return newScore;
        }, 0);
    });
    const scores = await Promise.all(scorePromises);
    const maxScore = Math.max(...scores);
    const bestIndex = scores.indexOf(maxScore);
    const bestRecipe = recipes[bestIndex];
    return [bestRecipe];
  }

  private getPercentDailyValue(
    nutrient: keyof INutrients,
    foodType: IFoodType
  ) {
    const dailyValues: Map<keyof INutrients, number> = new Map([
      ['fat', 75],
      ['saturatedFat', 10],
      ['transFat', 10],
      ['fiber', 28],
      ['sugars', 100],
      ['cholesterol', 0.3],
      ['sodium', 2.3],
      ['potassium', 3.4],
      ['calcium', 1.3],
      ['iron', 0.018],
      ['magnesium', 0.023],
      ['zinc', 0.011],
    ]);

    if (!foodType || !foodType.nutrients) {
      return 0;
    }
    const amount = foodType.nutrients[nutrient];
    if (!amount) {
      return 0;
    }
    // For now assume all units in g
    const amountGrams = parseInt(amount);
    const dailyValue = dailyValues.get(nutrient);
    if (!dailyValue) {
      throw new Error('Nutrient not found in Daily Value table');
    }
    return amountGrams / dailyValue;
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

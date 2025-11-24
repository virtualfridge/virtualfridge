import axios from 'axios';

import logger from '../util/logger';
import {
  RecipeApiSummaryResponse,
  RecipeApiSummary,
  RecipeQuery,
  defaultRecipeIngredients,
  RecipeApiResponse,
  RecipeApiMeal,
  IRecipe,
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

  async getRecipes(query: RecipeQuery): Promise<IRecipe[]> {
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
    const mealsToIngredientsArray = [...mealsToIngredients.entries()];
    // Retrieve only the recipes that match the greatest number of ingredients possible
    const mostIngredientMatches = mealsToIngredientsArray.reduce(
      (max: number, currentValue: [string, Set<string>]) =>
        Math.max(max, currentValue[1].size),
      0
    );
    const recipeIds = mealsToIngredientsArray
      .filter(entry => entry[1].size == mostIngredientMatches)
      .map(entry => entry[0]);
    const recipePromises = recipeIds.map(async id => {
      const recipe = await this.getRecipe(id);
      if (recipe.meals) {
        return recipe.meals;
      }
      return null;
    });
    const recipes = (await Promise.all(recipePromises))
      .flatMap(meals => meals ?? [])
      .map(meal => this.getRecipeFromApiResponse(meal));
    // Now we score the recipes based on nutrition facts
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
    const scorePromises = recipes.map(async recipe => {
      const foodTypePromises = recipe.ingredients.map(
        async ingredient => await foodTypeModel.findByName(ingredient.name)
      );

      const foodTypes = await Promise.all(foodTypePromises);

      return foodTypes.reduce((currentScore: number, foodType) => {
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
    if (scores.length > 0) {
      const maxScore = Math.max(...scores);
      const bestIndex = scores.indexOf(maxScore);
      const bestRecipe = recipes[bestIndex];
      return [bestRecipe];
    } else {
      return [];
    }
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

  private getRecipeFromApiResponse(recipe: RecipeApiMeal): IRecipe {
    const newRecipe: IRecipe = {
      name: recipe.strMeal,
      instructions: recipe.strInstructions,
      source: recipe.strSource,
      image: recipe.strImageSource,
      ingredients: [],
    };
    newRecipe.ingredients = [
      { name: recipe.strIngredient1, measure: recipe.strMeasure1 },
      { name: recipe.strIngredient2, measure: recipe.strMeasure2 },
      { name: recipe.strIngredient3, measure: recipe.strMeasure3 },
      { name: recipe.strIngredient4, measure: recipe.strMeasure4 },
      { name: recipe.strIngredient5, measure: recipe.strMeasure5 },
      { name: recipe.strIngredient6, measure: recipe.strMeasure6 },
      { name: recipe.strIngredient7, measure: recipe.strMeasure7 },
      { name: recipe.strIngredient8, measure: recipe.strMeasure8 },
      { name: recipe.strIngredient9, measure: recipe.strMeasure9 },
      { name: recipe.strIngredient10, measure: recipe.strMeasure10 },
      { name: recipe.strIngredient11, measure: recipe.strMeasure11 },
      { name: recipe.strIngredient12, measure: recipe.strMeasure12 },
      { name: recipe.strIngredient13, measure: recipe.strMeasure13 },
      { name: recipe.strIngredient14, measure: recipe.strMeasure14 },
      { name: recipe.strIngredient15, measure: recipe.strMeasure15 },
      { name: recipe.strIngredient16, measure: recipe.strMeasure16 },
      { name: recipe.strIngredient17, measure: recipe.strMeasure17 },
      { name: recipe.strIngredient18, measure: recipe.strMeasure18 },
      { name: recipe.strIngredient19, measure: recipe.strMeasure19 },
      { name: recipe.strIngredient20, measure: recipe.strMeasure20 },
    ].filter(ingredient => ingredient.name !== '');
    return newRecipe;
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

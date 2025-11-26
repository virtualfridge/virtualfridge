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
  AiRecipeData,
  ApiKeyError,
} from '../types/recipe';
import { foodTypeModel } from '../models/foodType';
import { IFoodType, INutrients } from '../types/foodType';
import { GEMINI_API_HOST, GEMINI_MODEL } from '../config/constants';
import { GeminiResponse } from '../types/ai';

const DEFAULT_API_BASE_URL = 'https://www.themealdb.com/api/json/v1/1';
const FILTER_ENDPOINT = '/filter.php';
const LOOKUP_ENDPOINT = '/lookup.php';

export class RecipeService {
  private readonly apiBaseUrl: string;
  private readonly apiKey: string;

  constructor(
    apiBaseUrl = process.env.THEMEALDB_BASE_URL ?? DEFAULT_API_BASE_URL,
    apiKey = process.env.GEMINI_API_KEY
  ) {
    this.apiBaseUrl = apiBaseUrl.replace(/\/$/, '');
    if (!apiKey) {
      throw new Error('Recipe service must be started with a gemini api key');
    }
    this.apiKey = apiKey;
  }

  async getRecipe(query: RecipeQuery): Promise<IRecipe | null> {
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
      const recipe = await this.getRecipeById(id);
      if (recipe.meals) {
        return recipe.meals;
      }
      return null;
    });
    const recipes = (await Promise.all(recipePromises))
      .flatMap(meals => meals ?? [])
      .map(meal => this.getRecipeFromApiResponse(meal));
    // Now we score the recipes based on nutrition facts
    const badNutrients: (keyof INutrients)[] = [
      'fat',
      'saturatedFat',
      'transFat',
      'sugars',
    ];
    const goodNutrients: (keyof INutrients)[] = [
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
      return recipes.at(bestIndex) ?? null;
    } else {
      return null;
    }
  }

  private getPercentDailyValue(
    nutrient: keyof INutrients,
    foodType: IFoodType
  ) {
    const dailyValues = new Map<keyof INutrients, number>([
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

    if (!foodType.nutrients) {
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

  private async getRecipeById(id: string): Promise<RecipeApiResponse> {
    const requestUrl = `${this.apiBaseUrl}${LOOKUP_ENDPOINT}`;
    const response = await axios.get<RecipeApiResponse>(requestUrl, {
      params: { i: id },
    });
    return response.data;
  }

  getExternalSourceLink(): string {
    return `${this.apiBaseUrl}${FILTER_ENDPOINT}`;
  }

  async generateRecipe(ingredients: string[]): Promise<AiRecipeData> {
    if (!this.apiKey) {
      throw new ApiKeyError('GEMINI_API_KEY is not set');
    }

    const tomlPayload = this.buildTomlPayload(ingredients);
    const prompt = this.buildPrompt(tomlPayload);

    const url = `${GEMINI_API_HOST}/${GEMINI_MODEL}:generateContent?key=${this.apiKey}`;

    logger.info('Requesting Gemini recipe generation', { model: GEMINI_MODEL });

    const { data } = await axios.post<GeminiResponse>(
      url,
      {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const recipe = this.extractRecipeText(data);

    if (!recipe) {
      throw new Error('Gemini returned an empty response.');
    }

    return {
      ingredients: ingredients.map(ingredient =>
        this.formatDisplayIngredient(ingredient)
      ),
      prompt,
      recipe,
      model: data.modelVersion ?? GEMINI_MODEL,
    };
  }

  private buildPrompt(toml: string): string {
    return [
      'You are the virtualfridge.ai culinary assistant.',
      'Craft a single, approachable recipe that uses only the provided ingredients. If common pantry staples (oil, salt, pepper) are needed you may include them.',
      'Return the recipe in Markdown with the following sections: Title (H2), Ingredients (list), Steps (numbered list), and a short Serving Suggestion paragraph.',
      'Do not mention that this was generated by AI.',
      'Input specification is provided as TOML. Use the ingredient `name` values for display.',
      '```toml',
      toml,
      '```',
    ].join('\n\n');
  }

  private buildTomlPayload(ingredients: string[]): string {
    const lines = [
      'title = "Virtual Fridge Recipe Request"',
      'version = "1.0"',
      '',
    ];

    ingredients.forEach((ingredient, index) => {
      lines.push('[[ingredients]]');
      lines.push(`id = "${index + 1}"`);
      lines.push(`key = "${ingredient}"`);
      lines.push(`name = "${this.formatDisplayIngredient(ingredient)}"`);
      lines.push('');
    });

    lines.push('[request]');
    lines.push('style = "Family friendly"');
    lines.push(
      'goal = "Create one complete recipe that highlights the provided ingredients."'
    );

    return lines.join('\n');
  }

  private extractRecipeText(response: GeminiResponse): string | null {
    const firstCandidate = response.candidates?.[0];
    if (!firstCandidate?.content?.parts) {
      return null;
    }

    const text = firstCandidate.content.parts
      .map(part => part.text?.trim())
      .filter(Boolean)
      .join('\n\n')
      .trim();

    return text || null;
  }

  private formatDisplayIngredient(raw: string): string {
    const cleaned = raw.replace(/[_-]+/g, ' ').trim().toLowerCase();

    return cleaned
      .split(' ')
      .filter(Boolean)
      .map(part => part[0].toUpperCase() + part.slice(1))
      .join(' ');
  }
}

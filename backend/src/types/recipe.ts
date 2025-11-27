import z from 'zod';

export const recipeIngredientSeparator = ',';

export const getRecipesQuerySchema = z.object({
  ingredients: z
    .string()
    .trim()
    .optional()
    .transform((value: string | undefined) =>
      value
        ? value
            .split(recipeIngredientSeparator)
            .map(part => part.trim())
            .filter(Boolean)
        : undefined
    ),
});

export type GetRecipesQuery = z.infer<typeof getRecipesQuerySchema>;

export interface RecipeQuery {
  ingredients?: string[];
}

export interface RecipeApiSummary {
  idMeal: string;
  strMeal: string;
  strMealThumb?: string;
}

export interface RecipeApiSummaryResponse {
  meals: RecipeApiSummary[] | null;
}

export interface IRecipe {
  name: string;
  instructions: string;
  thumbnail?: string;
  youtube?: string;
  ingredients: IIngredient[];
  source?: string;
  image?: string;
}

export interface IIngredient {
  name: string;
  measure: string;
}

export interface RecipeApiMeal {
  idMeal: string;
  strMeal: string;
  strMealAlternate?: string;
  strCategory?: string;
  strArea?: string;
  strInstructions: string;
  strMealThumb?: string;
  strTags?: string;
  strYoutube?: string;
  strIngredient1: string;
  strIngredient2: string;
  strIngredient3: string;
  strIngredient4: string;
  strIngredient5: string;
  strIngredient6: string;
  strIngredient7: string;
  strIngredient8: string;
  strIngredient9: string;
  strIngredient10: string;
  strIngredient11: string;
  strIngredient12: string;
  strIngredient13: string;
  strIngredient14: string;
  strIngredient15: string;
  strIngredient16: string;
  strIngredient17: string;
  strIngredient18: string;
  strIngredient19: string;
  strIngredient20: string;
  strMeasure1: string;
  strMeasure2: string;
  strMeasure3: string;
  strMeasure4: string;
  strMeasure5: string;
  strMeasure6: string;
  strMeasure7: string;
  strMeasure8: string;
  strMeasure9: string;
  strMeasure10: string;
  strMeasure11: string;
  strMeasure12: string;
  strMeasure13: string;
  strMeasure14: string;
  strMeasure15: string;
  strMeasure16: string;
  strMeasure17: string;
  strMeasure18: string;
  strMeasure19: string;
  strMeasure20: string;
  strSource?: string;
  strImageSource?: string;
  strCreativeCommonsConfirmed?: string;
  dateModified?: string;
}

export interface RecipeApiResponse {
  meals: RecipeApiMeal[] | null;
}

export interface GetRecipesResponse {
  message: string;
  data?: {
    recipe: IRecipe;
  };
}

export const defaultRecipeIngredients = ['chicken_breast'];

export const aiRecipeRequestSchema = z.object({
  ingredients: z.array(z.string().min(1)).nonempty(),
});

export type AiRecipeRequestBody = z.infer<typeof aiRecipeRequestSchema>;

export interface AiRecipeData {
  ingredients: string[];
  prompt: string;
  recipe: string;
  model: string;
}

export interface AiRecipeResponse {
  message: string;
  data?: AiRecipeData;
}

export class ApiKeyError extends Error {}

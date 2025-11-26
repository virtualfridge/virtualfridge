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

export interface RecipeSummary {
  idMeal: string;
  strMeal: string;
  strMealThumb?: string;
}

export interface RecipeApiResponse {
  meals: RecipeSummary[] | null;
}

export interface GetRecipesResponse {
  message: string;
  data: {
    ingredients: string[];
    meals: RecipeSummary[];
    externalSource: string;
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

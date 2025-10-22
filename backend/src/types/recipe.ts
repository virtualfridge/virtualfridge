import z from 'zod';

export const recipeIngredientSeparator = ',';

export const getRecipesQuerySchema = z.object({
  ingredients: z
    .string()
    .trim()
    .optional()
    .transform(value =>
      value
        ? value
            .split(recipeIngredientSeparator)
            .map(part => part.trim())
            .filter(Boolean)
        : undefined
    ),
});

export type GetRecipesQuery = z.infer<typeof getRecipesQuerySchema>;

export type RecipeQuery = {
  ingredients?: string[];
};

export type RecipeSummary = {
  idMeal: string;
  strMeal: string;
  strMealThumb?: string;
};

export type RecipeApiResponse = {
  meals: RecipeSummary[] | null;
};

export type GetRecipesResponse = {
  message: string;
  data: {
    ingredients: string[];
    meals: RecipeSummary[];
    externalSource: string;
  };
};

export const defaultRecipeIngredients = ['chicken_breast'];

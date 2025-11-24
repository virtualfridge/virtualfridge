import { createTestApp } from '../helpers/testApp';
import * as dbHandler from '../helpers/dbHandler';
import { userModel } from '../../models/user';
import request from 'supertest';
import { mockGoogleUserInfo } from '../helpers/testData';
import jwt from 'jsonwebtoken';
import { IIngredient, IRecipe } from '../../types/recipe';

describe('Recipe controller integration tests', () => {
  const app = createTestApp();
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    await dbHandler.connect();
  });

  beforeEach(async () => {
    // Create test user before each test
    const user = await userModel.create(mockGoogleUserInfo);
    userId = user._id.toString();
    authToken = jwt.sign({ id: userId }, process.env.JWT_SECRET!, {
      expiresIn: '1h',
    });
  });

  afterEach(async () => {
    await dbHandler.clearDatabase();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });
  describe('GET /api/recipes', () => {
    test('Valid single ingredient found in database', async () => {
      const ingredients = ['chicken_breast'];
      const response = await request(app)
        .get(`/api/recipes?ingredients=${ingredients.join(',')}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('recipes');
      expect(response.body.data.recipes).toBeInstanceOf(Array<IRecipe>);
      expect(response.body.data.recipes.length).toBeGreaterThanOrEqual(1);
      (response.body.data.recipes as Array<IRecipe>).forEach(recipe => {
        containsIngredientByName(recipe.ingredients, ingredients[0]);
      });
    });

    test('Multiple ingredients found in database', async () => {
      const ingredients = ['chicken_breast', 'egg'];
      const response = await request(app)
        .get(`/api/recipes?ingredients=${ingredients.join(',')}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('recipes');
      expect(response.body.data.recipes).toBeInstanceOf(Array<IRecipe>);
      expect(response.body.data.recipes.length).toBeGreaterThanOrEqual(1);
      (response.body.data.recipes as Array<IRecipe>).forEach(recipe => {
        containsIngredientByName(recipe.ingredients, ingredients[0]) &&
          containsIngredientByName(recipe.ingredients, ingredients[1]);
      });
    });

    test('Multiple ingredients given but only one found', async () => {
      const ingredients = ['chicken_breast', 'nutella'];
      const response = await request(app)
        .get(`/api/recipes?ingredients=${ingredients.join(',')}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('recipes');
      expect(response.body.data.recipes).toBeInstanceOf(Array<IRecipe>);
      expect(response.body.data.recipes.length).toBeGreaterThanOrEqual(1);
      (response.body.data.recipes as Array<IRecipe>).forEach(recipe => {
        expect(
          containsIngredientByName(recipe.ingredients, ingredients[0]) ||
            containsIngredientByName(recipe.ingredients, ingredients[1])
        ).toEqual(true);
      });
    });
  });
});

// Checks if a list of ingredients contains a single ingredient based only on the
// name (the ingredient interface also has a measure property)
const containsIngredientByName = (
  ingredientList: Array<IIngredient>,
  ingredientName: string
) => {
  return ingredientList.reduce(
    (previousValue: boolean, currentValue: IIngredient) =>
      currentValue.name == ingredientName || previousValue,
    false
  );
};
